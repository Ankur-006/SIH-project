"""
Inbox Router
Provides POST /api/inbox/connect endpoint that connects to a user's email
via IMAP, fetches their latest emails, and runs each through the full
threat analysis engine.
"""

from fastapi import APIRouter, HTTPException
import time
from datetime import datetime

from models.request_models import InboxConnectRequest
from data.database import save_report

from engine.imap_fetcher import fetch_inbox_emails, detect_imap_host
from engine.header_parser import (
    parse_email,
    extract_ips,
    reconstruct_relay_path,
    detect_header_anomalies,
)
from engine.auth_validator import validate_authentication
from engine.nlp_analyzer import analyze_email_content
from engine.link_analyzer import analyze_links
from engine.ip_intelligence import batch_lookup_ips
from engine.domain_intelligence import analyze_domain
from engine.threat_scorer import calculate_threat_score

router = APIRouter(prefix="/api/inbox", tags=["Inbox"])


@router.post("/detect-host")
async def detect_host(payload: dict):
    """Auto-detect IMAP host from email address."""
    email_addr = payload.get("email", "")
    if not email_addr or "@" not in email_addr:
        raise HTTPException(status_code=400, detail="Invalid email address")
    try:
        host = detect_imap_host(email_addr)
        return {"host": host}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/connect")
async def connect_inbox(payload: InboxConnectRequest):
    """
    Connect to user's mailbox via IMAP, fetch latest emails,
    and run each through the full threat analysis pipeline.
    """
    # Step 1: Fetch raw emails via IMAP
    try:
        raw_emails = fetch_inbox_emails(
            email_address=payload.email,
            password=payload.password,
            imap_server=payload.imapServer,
            max_emails=payload.maxEmails or 30,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to email server: {str(e)}",
        )

    if not raw_emails:
        return {
            "success": True,
            "email": payload.email,
            "totalFetched": 0,
            "totalThreats": 0,
            "results": [],
        }

    # Step 2: Analyze each email through the existing engine
    results = []
    errors = 0

    for idx, email_data in enumerate(raw_emails):
        raw_text = email_data["raw"]
        try:
            # Parse headers
            parsed = parse_email(raw_text)

            # Extract IPs and relay path
            ips = extract_ips(parsed.get("receivedHeaders", []))
            relay_path = reconstruct_relay_path(parsed.get("receivedHeaders", []))
            header_anomalies = detect_header_anomalies(parsed)

            # Authentication validation
            auth_result = validate_authentication(parsed)

            # NLP content analysis
            subject = parsed.get("subject", "")
            body = parsed.get("body", "")
            from_dict = parsed.get("from", {})
            nlp_result = analyze_email_content(subject, body, from_dict)

            # Link analysis
            link_result = analyze_links(body)

            # IP geolocation (limit to first 3 per email for speed)
            ip_results = await batch_lookup_ips(ips[:3])

            # Domain intelligence
            from_email = from_dict.get("email", "")
            sender_domain = from_email.split("@")[1] if "@" in from_email else ""
            domain_result = analyze_domain(sender_domain)

            # Unified threat assessment
            analysis_context = {
                "headerAnomalies": header_anomalies,
                "authResult": auth_result,
                "nlpResult": nlp_result,
                "linkResult": link_result,
                "ipResults": ip_results,
                "domainResult": domain_result,
            }
            threat_assessment = calculate_threat_score(analysis_context)

            analysis_id = f"INBOX-{int(time.time() * 1000)}-{idx}"
            timestamp = datetime.utcnow().isoformat() + "Z"

            result = {
                "id": analysis_id,
                "timestamp": timestamp,
                "source": "inbox",
                "raw": raw_text,
                "parsed": parsed,
                "ips": ips,
                "relayPath": relay_path,
                "headerAnomalies": header_anomalies,
                "authResult": auth_result,
                "nlpResult": nlp_result,
                "linkResult": link_result,
                "ipResults": ip_results,
                "domainResult": domain_result,
                "threatAssessment": threat_assessment,
            }

            # Persist to database
            save_report(result)
            results.append(result)

        except Exception as e:
            errors += 1
            # Skip individual emails that fail analysis
            continue

    # Sort results by threat score (highest first)
    results.sort(
        key=lambda r: r.get("threatAssessment", {}).get("threatScore", 0),
        reverse=True,
    )

    total_threats = sum(
        1
        for r in results
        if r.get("threatAssessment", {}).get("threatScore", 0) >= 35
    )

    return {
        "success": True,
        "email": payload.email,
        "totalFetched": len(results),
        "totalThreats": total_threats,
        "errors": errors,
        "results": results,
    }

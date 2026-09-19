"""
Domain Intelligence Router
Provides standalone WHOIS, reputation, typosquatting, and TLD threat analysis for any domain.
"""

from fastapi import APIRouter, HTTPException, Depends
from models.request_models import DomainLookupRequest
from engine.domain_intelligence import analyze_domain
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/domain", tags=["Domain Intelligence"])

@router.post("/lookup")
async def domain_lookup(req: DomainLookupRequest, current_user: dict = Depends(get_current_user)):
    domain = req.domain.strip().lower()
    # Strip protocols or paths if passed
    if "://" in domain:
        domain = domain.split("://")[1]
    domain = domain.split("/")[0].split(":")[0]

    if not domain or "." not in domain:
        raise HTTPException(status_code=400, detail="Invalid domain format. Example: example-paypal.com")

    analysis = analyze_domain(domain)
    return analysis

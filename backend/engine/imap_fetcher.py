"""
IMAP Email Fetcher
Connects to a user's mailbox via IMAP4_SSL, fetches the latest N emails
as raw RFC 822 text for analysis by the existing threat engine.
"""

import imaplib
import email as email_lib


# Auto-detect IMAP host from common email provider domains
IMAP_HOSTS = {
    "gmail.com": "imap.gmail.com",
    "googlemail.com": "imap.gmail.com",
    "outlook.com": "outlook.office365.com",
    "hotmail.com": "outlook.office365.com",
    "live.com": "outlook.office365.com",
    "msn.com": "outlook.office365.com",
    "yahoo.com": "imap.mail.yahoo.com",
    "yahoo.in": "imap.mail.yahoo.com",
    "yahoo.co.in": "imap.mail.yahoo.com",
    "yahoo.co.uk": "imap.mail.yahoo.com",
    "aol.com": "imap.aol.com",
    "icloud.com": "imap.mail.me.com",
    "me.com": "imap.mail.me.com",
    "mac.com": "imap.mail.me.com",
    "zoho.com": "imap.zoho.com",
    "zoho.in": "imap.zoho.in",
    "protonmail.com": "127.0.0.1",  # ProtonMail Bridge required
    "proton.me": "127.0.0.1",
    "yandex.com": "imap.yandex.com",
    "rediffmail.com": "imap.rediffmail.com",
    "mail.com": "imap.mail.com",
    "gmx.com": "imap.gmx.com",
    "gmx.net": "imap.gmx.net",
}

# Default IMAP port for SSL
IMAP_SSL_PORT = 993


def detect_imap_host(email_address: str) -> str:
    """
    Detect the IMAP server hostname from a user's email address.
    Returns the host string or raises ValueError for unknown domains.
    """
    domain = email_address.strip().lower().split("@")[-1]
    host = IMAP_HOSTS.get(domain)
    if host:
        return host
    # Fallback: try imap.<domain>
    return f"imap.{domain}"


def fetch_inbox_emails(
    email_address: str,
    password: str,
    imap_server: str = None,
    max_emails: int = 30,
    folder: str = "INBOX",
) -> list[dict]:
    """
    Connect to IMAP server and fetch the latest `max_emails` from the inbox.

    Returns a list of dicts, each containing:
      - uid: IMAP message UID
      - raw: full RFC 822 email text (str)
      - size: approximate byte size

    Raises ConnectionError or ValueError on failure.
    """
    # Resolve IMAP host
    host = imap_server if imap_server else detect_imap_host(email_address)

    try:
        # Connect via SSL
        conn = imaplib.IMAP4_SSL(host, IMAP_SSL_PORT)
    except Exception as e:
        raise ConnectionError(
            f"Could not connect to IMAP server '{host}:{IMAP_SSL_PORT}'. "
            f"Check the server address. Error: {e}"
        )

    try:
        # Login
        conn.login(email_address, password)
    except imaplib.IMAP4.error as e:
        conn.logout()
        error_msg = str(e)
        if "AUTHENTICATIONFAILED" in error_msg.upper() or "INVALID" in error_msg.upper():
            raise ValueError(
                "Authentication failed. Please check your email and app password. "
                "For Gmail, you need to use an App Password (not your regular password)."
            )
        raise ValueError(f"Login failed: {error_msg}")

    try:
        # Select mailbox folder
        status, data = conn.select(folder, readonly=True)
        if status != "OK":
            raise ValueError(f"Could not open folder '{folder}': {data}")

        # Search for all messages
        status, msg_ids = conn.search(None, "ALL")
        if status != "OK" or not msg_ids[0]:
            conn.close()
            conn.logout()
            return []

        # Get the latest N message IDs
        all_ids = msg_ids[0].split()
        latest_ids = all_ids[-max_emails:]  # Take last N (most recent)
        latest_ids.reverse()  # Most recent first

        results = []
        for msg_id in latest_ids:
            try:
                status, msg_data = conn.fetch(msg_id, "(RFC822)")
                if status != "OK" or not msg_data or not msg_data[0]:
                    continue

                raw_bytes = msg_data[0][1]
                if isinstance(raw_bytes, bytes):
                    # Decode with fallback
                    try:
                        raw_text = raw_bytes.decode("utf-8", errors="replace")
                    except Exception:
                        raw_text = raw_bytes.decode("latin-1", errors="replace")
                else:
                    raw_text = str(raw_bytes)

                results.append({
                    "uid": msg_id.decode() if isinstance(msg_id, bytes) else str(msg_id),
                    "raw": raw_text,
                    "size": len(raw_bytes),
                })
            except Exception:
                # Skip individual emails that fail to fetch
                continue

        conn.close()
        conn.logout()
        return results

    except (ValueError, ConnectionError):
        raise
    except Exception as e:
        try:
            conn.logout()
        except Exception:
            pass
        raise ConnectionError(f"Error fetching emails: {e}")

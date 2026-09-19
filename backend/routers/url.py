"""
URL Intelligence Router
Inspects individual URLs for phishing, spoofing, IP masking, redirect patterns, and risk score.
"""

from fastapi import APIRouter, HTTPException, Depends
from models.request_models import UrlAnalyzeRequest
from engine.link_analyzer import _analyze_url
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/url", tags=["URL Intelligence"])

@router.post("/analyze")
async def analyze_url_endpoint(req: UrlAnalyzeRequest, current_user: dict = Depends(get_current_user)):
    url = req.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://" + url

    result = _analyze_url(url)
    return result

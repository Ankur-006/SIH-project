"""
Global Search Router
Searches across forensic reports, cases, users, IOC domains, and IP hops.
"""

from fastapi import APIRouter, Query, Depends
from data.database import search_all
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("")
async def global_search(
    q: str = Query("", description="Search term across subjects, IPs, cases, domains"),
    current_user: dict = Depends(get_current_user)
):
    results = search_all(q)
    return {
        "query": q,
        "results": results,
        "counts": {k: len(v) for k, v in results.items()}
    }

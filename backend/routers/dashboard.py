"""
Dashboard Analytics Router
Aggregates live forensic intelligence metrics, incident timeline, and vector stats.
"""

from fastapi import APIRouter, Depends
from data.database import get_dashboard_stats
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    stats = get_dashboard_stats()
    return stats

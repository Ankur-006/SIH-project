"""
Audit Trail Router
Provides immutable security activity logging for DFIR compliance.
"""

from fastapi import APIRouter, Query, Depends
from typing import Optional
from middleware.auth_middleware import require_role
from data.database import get_audit_logs

router = APIRouter(prefix="/api/audit-logs", tags=["Audit"])

@router.get("")
async def fetch_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["Super Admin", "Security Analyst"]))
):
    logs = get_audit_logs(limit=limit, category=category)
    return {
        "logs": logs,
        "total": len(logs)
    }

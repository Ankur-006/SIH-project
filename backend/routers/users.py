"""
User Management Router
Handles CRUD operations, role assignments, and password resets for administrative control.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from datetime import datetime, timezone
import uuid
from typing import List
from models.request_models import UserCreateRequest, UserUpdateRequest, PasswordResetRequest
from middleware.auth_middleware import (
    hash_password,
    get_current_user,
    require_role,
)
from data.database import (
    get_all_users,
    get_user_by_id,
    get_user_by_email,
    save_user,
    update_user,
    delete_user,
    save_audit_log,
)

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("")
async def list_users(current_user: dict = Depends(require_role(["Super Admin", "Security Analyst"]))):
    """List all registered platform users."""
    users = get_all_users()
    return {"users": users}

@router.get("/{user_id}")
async def get_user_detail(user_id: str, current_user: dict = Depends(get_current_user)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": {k: v for k, v in user.items() if k != "passwordHash"}}

@router.post("")
async def create_user(
    req: UserCreateRequest,
    request: Request,
    admin_user: dict = Depends(require_role(["Super Admin"]))
):
    email = req.email.strip().lower()
    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    parts = req.name.strip().split()
    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "US"

    now_iso = datetime.now(timezone.utc).isoformat()
    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:8]}",
        "email": email,
        "name": req.name.strip(),
        "passwordHash": hash_password(req.password),
        "role": req.role,
        "avatar": avatar,
        "status": req.status or "active",
        "createdAt": now_iso,
        "lastLogin": None,
    }

    save_user(new_user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=admin_user.get("email"),
        actor_name=admin_user.get("name"),
        action="User Created",
        details=f"Created user {email} with role '{req.role}' and status '{req.status}'",
        ip_address=client_ip,
        category="Admin"
    )

    return {
        "message": "User created successfully",
        "user": {k: v for k, v in new_user.items() if k != "passwordHash"},
    }

@router.put("/{user_id}")
async def edit_user(
    user_id: str,
    req: UserUpdateRequest,
    request: Request,
    admin_user: dict = Depends(require_role(["Super Admin"]))
):
    target_user = get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    updates = {}
    if req.name is not None:
        updates["name"] = req.name.strip()
        parts = req.name.strip().split()
        updates["avatar"] = "".join([p[0].upper() for p in parts[:2]]) if parts else "US"
    if req.email is not None:
        new_email = req.email.strip().lower()
        if new_email != target_user.get("email"):
            existing = get_user_by_email(new_email)
            if existing and existing.get("id") != user_id:
                raise HTTPException(status_code=400, detail="Email is already used by another account.")
            updates["email"] = new_email
    if req.role is not None:
        updates["role"] = req.role
    if req.status is not None:
        updates["status"] = req.status

    updated = update_user(user_id, updates)

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=admin_user.get("email"),
        actor_name=admin_user.get("name"),
        action="User Updated",
        details=f"Updated profile for user ID {user_id} ({updates})",
        ip_address=client_ip,
        category="Admin"
    )

    return {"message": "User updated successfully", "user": updated}

@router.delete("/{user_id}")
async def remove_user(
    user_id: str,
    request: Request,
    admin_user: dict = Depends(require_role(["Super Admin"]))
):
    if admin_user.get("id") == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own administrator account.")

    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    delete_user(user_id)

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=admin_user.get("email"),
        actor_name=admin_user.get("name"),
        action="User Deleted",
        details=f"Permanently removed user account: {target.get('email')} (ID: {user_id})",
        ip_address=client_ip,
        category="Admin"
    )

    return {"message": "User deleted successfully"}

@router.put("/{user_id}/password")
async def reset_user_password(
    user_id: str,
    req: PasswordResetRequest,
    request: Request,
    admin_user: dict = Depends(require_role(["Super Admin"]))
):
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    update_user(user_id, {"passwordHash": hash_password(req.newPassword)})

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=admin_user.get("email"),
        actor_name=admin_user.get("name"),
        action="Password Reset",
        details=f"Admin initiated password reset for user: {target.get('email')}",
        ip_address=client_ip,
        category="Admin"
    )

    return {"message": "User password reset successfully."}

"""
Settings and Profile Router
Handles user profile management, self password change, and platform preferences.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from models.request_models import (
    ProfileUpdateRequest,
    PasswordChangeRequest,
    SettingsUpdateRequest,
)
from middleware.auth_middleware import (
    get_current_user,
    hash_password,
    verify_password,
)
from data.database import (
    get_user_by_id,
    get_user_by_email,
    update_user,
    get_user_settings,
    save_user_settings,
    save_audit_log,
)

router = APIRouter(prefix="/api", tags=["Settings & Profile"])

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"profile": {k: v for k, v in user.items() if k != "passwordHash"}}

@router.put("/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    updates = {}
    if req.name is not None:
        updates["name"] = req.name.strip()
        parts = req.name.strip().split()
        updates["avatar"] = "".join([p[0].upper() for p in parts[:2]]) if parts else "US"
    if req.avatar is not None:
        updates["avatar"] = req.avatar
    if req.phone is not None:
        updates["phone"] = req.phone
    if req.department is not None:
        updates["department"] = req.department
    if req.bio is not None:
        updates["bio"] = req.bio

    updated_user = update_user(current_user["id"], updates)

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=current_user.get("email"),
        actor_name=current_user.get("name"),
        action="Profile Updated",
        details="User modified account details",
        ip_address=client_ip,
        category="Account"
    )

    return {"message": "Profile updated successfully", "profile": updated_user}

@router.put("/profile/password")
async def change_password(
    req: PasswordChangeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    user_record = get_user_by_id(current_user["id"])
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found.")

    curr_hash = user_record.get("passwordHash")
    if not curr_hash or not verify_password(req.currentPassword, curr_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    new_hash = hash_password(req.newPassword)
    update_user(current_user["id"], {"passwordHash": new_hash})

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=current_user.get("email"),
        actor_name=current_user.get("name"),
        action="Password Changed",
        details="User successfully changed their account password",
        ip_address=client_ip,
        category="Account"
    )

    return {"message": "Password changed successfully."}

@router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = get_user_settings(current_user["email"])
    return {"settings": settings}

@router.put("/settings")
async def save_settings(
    req: SettingsUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    payload = req.model_dump()
    saved = save_user_settings(current_user["email"], payload)
    return {"message": "Settings saved", "settings": saved}

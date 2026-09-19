"""
Authentication Router
Handles user login, logout, profile retrieval, and token validation.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from datetime import datetime, timezone
import uuid
from models.request_models import LoginRequest, RegisterRequest
from middleware.auth_middleware import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    require_role,
)
from data.database import (
    get_user_by_email,
    save_user,
    update_user,
    save_audit_log,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    user = get_user_by_email(email)

    if not user:
        # Audit failed login attempt
        client_ip = request.client.host if request.client else "127.0.0.1"
        save_audit_log(
            actor_email=email,
            actor_name="Unknown",
            action="Failed Login Attempt",
            details=f"Login attempt failed: Email not found ({email})",
            ip_address=client_ip,
            category="Auth"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact your Security Administrator.",
        )

    # Verify password hash
    password_hash = user.get("passwordHash")
    if not password_hash or not verify_password(req.password, password_hash):
        client_ip = request.client.host if request.client else "127.0.0.1"
        save_audit_log(
            actor_email=email,
            actor_name=user.get("name", "User"),
            action="Failed Login Attempt",
            details=f"Incorrect password provided for user {email}",
            ip_address=client_ip,
            category="Auth"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Update last login time
    now_iso = datetime.now(timezone.utc).isoformat()
    client_ip = request.client.host if request.client else "127.0.0.1"
    update_user(user["id"], {"lastLogin": now_iso})

    # Save audit log
    save_audit_log(
        actor_email=email,
        actor_name=user.get("name", "User"),
        action="User Logged In",
        details=f"User authenticated successfully via credentials (Role: {user.get('role')})",
        ip_address=client_ip,
        category="Auth"
    )

    # Generate JWT
    token_data = {
        "sub": email,
        "name": user.get("name"),
        "role": user.get("role"),
        "id": user.get("id"),
    }
    access_token = create_access_token(token_data)

    safe_user = {k: v for k, v in user.items() if k != "passwordHash"}
    safe_user["lastLogin"] = now_iso

    return {
        "token": access_token,
        "tokenType": "Bearer",
        "user": safe_user,
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user
    }

@router.post("/logout")
async def logout(request: Request, current_user: dict = Depends(get_current_user)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=current_user.get("email"),
        actor_name=current_user.get("name"),
        action="User Logged Out",
        details="Session terminated by user",
        ip_address=client_ip,
        category="Auth"
    )
    return {"message": "Logged out successfully"}

@router.post("/register")
async def register(
    req: RegisterRequest,
    request: Request,
    admin_user: dict = Depends(require_role(["Super Admin"]))
):
    email = req.email.strip().lower()
    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    # Initials for avatar
    parts = req.name.strip().split()
    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "US"

    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:8]}",
        "email": email,
        "name": req.name.strip(),
        "passwordHash": hash_password(req.password),
        "role": req.role or "Viewer",
        "avatar": avatar,
        "status": "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "lastLogin": None,
    }

    save_user(new_user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    save_audit_log(
        actor_email=admin_user.get("email"),
        actor_name=admin_user.get("name"),
        action="User Registered",
        details=f"Admin registered new user: {email} with role {new_user['role']}",
        ip_address=client_ip,
        category="Admin"
    )

    return {
        "message": "User registered successfully",
        "user": {k: v for k, v in new_user.items() if k != "passwordHash"},
    }

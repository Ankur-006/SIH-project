"""
Notifications Router
Manages alerts, threat detections, and system announcements.
"""

from fastapi import APIRouter, HTTPException, Depends
from models.request_models import NotificationCreateRequest
from middleware.auth_middleware import get_current_user
from data.database import (
    get_notifications,
    create_notification,
    mark_notification_read,
    mark_all_notifications_read,
    delete_notification,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    notifs = get_notifications(user_email=user_email)
    unread_count = sum(1 for n in notifs if not n.get("read"))
    return {
        "notifications": notifs,
        "unreadCount": unread_count
    }

@router.post("")
async def add_notification(
    req: NotificationCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    notif = create_notification(
        title=req.title,
        message=req.message,
        ntype=req.type,
        user_email=current_user.get("email"),
        link=req.link
    )
    return {"message": "Notification created", "notification": notif}

@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    mark_notification_read(notif_id)
    return {"message": "Notification marked as read"}

@router.put("/read-all/mark")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    mark_all_notifications_read(user_email=user_email)
    return {"message": "All notifications marked as read"}

@router.delete("/{notif_id}")
async def remove_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    deleted = delete_notification(notif_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

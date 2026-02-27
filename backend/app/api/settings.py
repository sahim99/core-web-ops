"""
Settings API — Profile, Password, Email OTP, Workspace, Notifications, Billing.
Production-grade endpoints for the SaaS Settings Hub.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.core.security import get_current_user, verify_password, hash_password
from app.models.user import User
from app.models.workspace import Workspace
from app.models.notification import NotificationPreference
from app.schemas.auth import UserResponse
from app.schemas.settings import ProfileUpdate, PasswordChange, EmailUpdateRequest, EmailVerifyRequest, WorkspaceUpdate
from app.utils.enums import UserRole, WorkspaceStatus
import secrets
from datetime import datetime, timedelta

# ── Bootstrap ─────────────────────────────────────────────────────
# Ensure notification_preferences table exists (safe / idempotent)
NotificationPreference.__table__.create(bind=engine, checkfirst=True)

router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Inline Schemas ────────────────────────────────────────────────

class NotificationUpdate(BaseModel):
    email_alerts: bool
    in_app_notifications: bool
    marketing_emails: bool


# ── OTP Store (mock — use Redis in production) ───────────────────
otp_store: dict = {}


# ══════════════════════════════════════════════════════════════════
# PROFILE
# ══════════════════════════════════════════════════════════════════

@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile details (Name, Phone, Avatar)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.avatar_url is not None:
        # avatar_url may not exist on User model yet — guard safely
        if hasattr(current_user, "avatar_url"):
            current_user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ══════════════════════════════════════════════════════════════════
# PASSWORD
# ══════════════════════════════════════════════════════════════════

@router.post("/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password. Requires current password verification."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ══════════════════════════════════════════════════════════════════
# EMAIL OTP FLOW
# ══════════════════════════════════════════════════════════════════

@router.post("/email/otp")
def send_email_otp(
    payload: EmailUpdateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send OTP for email update."""
    existing = db.query(User).filter(
        User.email == payload.new_email,
        User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    otp = secrets.token_hex(3).upper()  # 6-char hex
    otp_store[payload.new_email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
    }

    # Mock email send (replace with real provider in production)
    print(f"──── MOCK EMAIL ────")
    print(f"  To:      {payload.new_email}")
    print(f"  Subject: Verify your new email")
    print(f"  Code:    {otp}")
    print(f"────────────────────")

    return {"message": "OTP sent to new email"}


@router.post("/email/verify")
def verify_email_otp(
    payload: EmailVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify OTP and update email."""
    data = otp_store.get(payload.new_email)
    if not data:
        raise HTTPException(status_code=400, detail="OTP expired or not found")

    if datetime.utcnow() > data["expires_at"]:
        otp_store.pop(payload.new_email, None)
        raise HTTPException(status_code=400, detail="OTP expired")

    if data["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    current_user.email = payload.new_email
    db.commit()
    otp_store.pop(payload.new_email, None)

    return {"message": "Email updated successfully"}


# ══════════════════════════════════════════════════════════════════
# WORKSPACE
# ══════════════════════════════════════════════════════════════════

@router.get("/workspace")
def get_workspace_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get workspace details. Available to all authenticated users."""
    workspace = db.query(Workspace).filter(
        Workspace.id == current_user.workspace_id
    ).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return {
        "name": workspace.name,
        "slug": workspace.slug,
        "id": workspace.id,
        "status": workspace.status.value if workspace.status else "active",
        "logo_url": getattr(workspace, "logo_url", None),
    }


@router.patch("/workspace")
def update_workspace(
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update workspace details. Owner only."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owners can update workspace settings")

    workspace = db.query(Workspace).filter(
        Workspace.id == current_user.workspace_id
    ).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if payload.name is not None:
        workspace.name = payload.name
    if payload.logo_url is not None and hasattr(workspace, "logo_url"):
        workspace.logo_url = payload.logo_url

    db.commit()
    db.refresh(workspace)
    return {
        "message": "Workspace updated",
        "workspace": {
            "name": workspace.name,
            "slug": workspace.slug,
            "logo_url": getattr(workspace, "logo_url", None),
        },
    }


@router.delete("/workspace")
def delete_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete workspace permanently. Owner only."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owners can delete workspace")

    workspace = db.query(Workspace).filter(
        Workspace.id == current_user.workspace_id
    ).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    try:
        # CASCADE on relationship handles child records
        db.delete(workspace)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete workspace: {str(e)}",
        )

    return {"message": "Workspace deleted successfully"}


# ══════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════

@router.get("/notifications")
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user notification preferences. Auto-creates defaults if missing."""
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return {
        "email_alerts": prefs.email_alerts,
        "in_app_notifications": prefs.in_app_notifications,
        "marketing_emails": prefs.marketing_emails,
    }


@router.patch("/notifications")
def update_notification_preferences(
    payload: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notification preferences."""
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)

    prefs.email_alerts = payload.email_alerts
    prefs.in_app_notifications = payload.in_app_notifications
    prefs.marketing_emails = payload.marketing_emails

    db.commit()
    return {"message": "Preferences updated"}


# ══════════════════════════════════════════════════════════════════
# BILLING (Mock — integrate Stripe in production)
# ══════════════════════════════════════════════════════════════════

@router.get("/billing")
def get_billing_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get billing info for the workspace. Returns mock data for now."""
    workspace = db.query(Workspace).filter(
        Workspace.id == current_user.workspace_id
    ).first()

    return {
        "plan": "free",
        "status": "active",
        "billing_email": current_user.email,
        "monthly_limit": 1000,
        "workspace_name": workspace.name if workspace else "Unknown",
        "subscription_id": None,
        "next_billing_date": None,
    }

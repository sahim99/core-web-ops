"""
Auth API – registration, login, logout, and current user.
Hardened with httpOnly cookies, CSRF protection, and rate limiting.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.staff_permission import StaffPermission
from app.schemas.auth import (
    UserCreate, 
    UserResponse, 
    TokenWithUser, 
    UserLogin,
    StaffLogin,
    PermissionsPayload,
)
from app.core.csrf import generate_csrf_token
from app.core.rate_limit import limit_requests
from app.services.event_dispatcher import dispatch_event_background
from app.services.demo_seeder import seed_demo_data
from app.utils.enums import UserRole, WorkspaceStatus, AutomationEventType

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Helpers ──────────────────────────────────────────────────────

def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from name."""
    import re
    import secrets
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f"{slug}-{secrets.token_hex(3)}"


def _set_auth_cookies(response: Response, access_token: str, csrf_token: str):
    """Set httpOnly access token and CSRF cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in HTTPS production
        samesite="lax",
        max_age=60 * 60 * 24
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # JS-readable for X-CSRF-Token header
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24
    )


@router.post("/register", response_model=TokenWithUser, status_code=status.HTTP_201_CREATED, dependencies=[Depends(limit_requests)])
def register(response: Response, payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Register a new Owner. Creates a workspace and the first user.
    Sets httpOnly session cookie and returns a CSRF token.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create workspace
    workspace = Workspace(
        name=payload.workspace_name,
        slug=generate_slug(payload.workspace_name),
        status=WorkspaceStatus.SETUP,
    )
    db.add(workspace)
    db.flush()

    # Create owner user (owner_id and staff_id remain NULL)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.OWNER,
        workspace_id=workspace.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # JWT payload – owner gets role in token
    access_token = create_access_token(data={
        "sub": str(user.id),
        "role": "owner",
    })
    csrf_token = generate_csrf_token()
    _set_auth_cookies(response, access_token, csrf_token)

    # Send welcome email (owner only, non-blocking)
    # Dispatch welcome event
    background_tasks.add_task(
        dispatch_event_background, 
        workspace.id, 
        AutomationEventType.OWNER_REGISTERED.value, 
        user.id,
        {} 
    )

    return TokenWithUser(
        access_token="cookie-based", 
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenWithUser, dependencies=[Depends(limit_requests)])
def login(response: Response, payload: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Login with JSON credentials. Works for both owner and staff (via email).
    Sets httpOnly session cookie.
    """
    user = db.query(User).filter(User.email == payload.email, User.is_deleted == False).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Build JWT payload — extend with role info
    token_data = {"sub": str(user.id), "role": user.role.value}
    if user.role == UserRole.STAFF:
        token_data["staff_id"] = user.staff_id
        token_data["owner_id"] = user.owner_id

    access_token = create_access_token(data=token_data)
    csrf_token = generate_csrf_token()
    _set_auth_cookies(response, access_token, csrf_token)

    # Send login notification (owner only, non-blocking)
    if user.role == UserRole.OWNER:
        background_tasks.add_task(
            dispatch_event_background,
            user.workspace_id,
            AutomationEventType.OWNER_LOGGED_IN.value,
            user.id,
            {}
        )

    return TokenWithUser(
        access_token="cookie-based", 
        user=UserResponse.model_validate(user),
    )


DEMO_EMAIL = "demo@corewebops.com"
DEMO_PASSWORD = "DemoUser@2024!"


def _get_or_create_demo_user(db: Session) -> User:
    """Return the demo user, auto-creating the workspace + account on first call.
    Also patches stale name/workspace values on each call so resets are seamless.
    """
    user = db.query(User).filter(
        User.email == DEMO_EMAIL,
        User.is_demo == True,
        User.is_deleted == False,
    ).first()

    if user:
        # Patch name if still using the old default
        if user.full_name in ("Demo User", "demo"):
            user.full_name = "Alex Rivera"
            db.commit()
            db.refresh(user)
        return user

    # Auto-create demo workspace
    workspace = Workspace(
        name="Rivera & Co.",
        slug="rivera-co-demo",
        status=WorkspaceStatus.ACTIVE,
    )
    db.add(workspace)
    db.flush()

    # Auto-create demo user
    user = User(
        email=DEMO_EMAIL,
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name="Alex Rivera",
        role=UserRole.OWNER,
        workspace_id=workspace.id,
        is_active=True,
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/demo-login", response_model=TokenWithUser, dependencies=[Depends(limit_requests)])
def demo_login(response: Response, db: Session = Depends(get_db)):
    """
    Login endpoint for public demo mode. No credentials required.
    Auto-creates the demo account + workspace on first use.
    Seeds realistic demo data (contacts, bookings, inventory, inbox) on first login.
    """
    user = _get_or_create_demo_user(db)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo account is deactivated",
        )

    # Seed demo data idempotently (safe to call every login)
    seed_demo_data(db, workspace_id=user.workspace_id, owner_id=user.id)

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(data=token_data)
    csrf_token = generate_csrf_token()
    _set_auth_cookies(response, access_token, csrf_token)

    return TokenWithUser(
        access_token="cookie-based",
        user=UserResponse.model_validate(user),
    )


@router.post("/staff-login", response_model=TokenWithUser, dependencies=[Depends(limit_requests)])
def staff_login(response: Response, payload: StaffLogin, db: Session = Depends(get_db)):
    """
    Staff-specific login: requires staff_id + email + password.
    Strict verification order for multi-tenant security.
    """
    # 1. Find by staff_id
    staff = db.query(User).filter(
        User.staff_id == payload.staff_id,
        User.is_deleted == False,
    ).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 2. Verify role == staff
    if staff.role != UserRole.STAFF:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 3. Verify email matches
    if staff.email != payload.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 4. Verify owner exists and is active
    if not staff.owner_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff account not properly linked",
        )
    owner = db.query(User).filter(
        User.id == staff.owner_id,
        User.role == UserRole.OWNER,
        User.is_active == True,
        User.is_deleted == False,
    ).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Parent account is inactive or missing",
        )

    # 5. Verify staff account is active
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # 6. Verify password
    if not verify_password(payload.password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # 7. Build permissions from DB
    perm = db.query(StaffPermission).filter(StaffPermission.user_id == staff.id).first()
    perms_dict = {}
    if perm:
        perms_dict = {
            "inbox": perm.can_manage_inbox,
            "bookings": perm.can_manage_bookings,
            "forms": perm.can_manage_forms,
            "inventory": perm.can_view_inventory,
        }

    # 8. Issue JWT with enriched payload
    access_token = create_access_token(data={
        "sub": str(staff.id),
        "role": "staff",
        "staff_id": staff.staff_id,
        "owner_id": staff.owner_id,
        "permissions": perms_dict,
    })
    csrf_token = generate_csrf_token()
    _set_auth_cookies(response, access_token, csrf_token)

    return TokenWithUser(
        access_token="cookie-based",
        user=UserResponse.model_validate(staff),
    )


@router.post("/logout")
def logout(response: Response):
    """Logout by clearing session cookies."""
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user (from cookie)."""
    return UserResponse.model_validate(current_user)

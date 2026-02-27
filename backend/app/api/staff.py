"""
Staff API – manage staff members. Owner-only.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.core.database import get_db
from app.core.security import hash_password
from app.core.dependencies import require_role
from app.models.user import User
from app.models.staff_permission import StaffPermission
from app.schemas.auth import StaffCreate, UserResponse, PermissionsPayload
from app.utils.enums import UserRole
from app.utils.helpers import generate_staff_id
from app.core.csrf import verify_csrf

router = APIRouter(prefix="/staff", tags=["Staff Management"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_staff(
    payload: StaffCreate,
    current_user: User = Depends(require_role(UserRole.OWNER)),
    db: Session = Depends(get_db),
):
    """Add a new staff member to the workspace. Owner only."""
    # 1. Normalize Email
    email = payload.email.lower().strip()

    # 2. Pre-check Existing Email (Workspace Scoped)
    existing_user = (
        db.query(User)
        .filter(
            User.workspace_id == current_user.workspace_id,
            User.email == email,
            User.is_deleted == False
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists in this workspace."
        )

    # Generate unique staff ID
    sid = generate_staff_id(payload.full_name, db)

    try:
        # 1. Create User with staff identity fields
        staff = User(
            email=email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            phone=payload.phone,
            role=UserRole.STAFF,
            workspace_id=current_user.workspace_id,
            is_active=True,
            staff_id=sid,
            owner_id=current_user.id,
        )
        db.add(staff)
        db.flush()  # get staff.id

        # 2. Create Permissions
        perms = StaffPermission(
            user_id=staff.id,
            can_manage_inbox=payload.permissions.inbox,
            can_manage_bookings=payload.permissions.bookings,
            can_manage_forms=payload.permissions.forms,
            can_view_inventory=payload.permissions.inventory,
        )
        db.add(perms)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists in this workspace."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error"
        )
    db.refresh(staff)

    # Explicitly construct response
    perms_payload = PermissionsPayload(
        inbox=perms.can_manage_inbox,
        bookings=perms.can_manage_bookings,
        forms=perms.can_manage_forms,
        inventory=perms.can_view_inventory,
    )

    return UserResponse(
        id=staff.id,
        email=staff.email,
        full_name=staff.full_name,
        phone=staff.phone,
        role=staff.role,
        workspace_id=staff.workspace_id,
        is_active=staff.is_active,
        created_at=staff.created_at,
        permissions=perms_payload,
        staff_id=staff.staff_id,
        owner_id=staff.owner_id,
    )


@router.get("", response_model=List[UserResponse])
def list_staff(
    current_user: User = Depends(require_role(UserRole.OWNER)),
    db: Session = Depends(get_db),
):
    """List all staff members in the workspace. Owner only."""
    staff_members = (
        db.query(User)
        .filter(
            User.workspace_id == current_user.workspace_id,
            User.role == UserRole.STAFF,
            User.is_deleted == False,
        )
        .all()
    )
    return [UserResponse.model_validate(s) for s in staff_members]


@router.put("/{staff_id}/permissions", response_model=UserResponse, dependencies=[Depends(verify_csrf)])
def update_staff_permissions(
    staff_id: int,
    payload: PermissionsPayload,
    current_user: User = Depends(require_role(UserRole.OWNER)),
    db: Session = Depends(get_db),
):
    """Update permissions for a staff member."""
    staff = (
        db.query(User)
        .filter(
            User.id == staff_id,
            User.workspace_id == current_user.workspace_id,
            User.role == UserRole.STAFF,
            User.is_deleted == False,
        )
        .first()
    )
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    perm = db.query(StaffPermission).filter(StaffPermission.user_id == staff.id).first()
    if not perm:
        perm = StaffPermission(user_id=staff.id)
        db.add(perm)

    perm.can_manage_inbox = payload.inbox
    perm.can_manage_bookings = payload.bookings
    perm.can_manage_forms = payload.forms
    perm.can_view_inventory = payload.inventory

    db.commit()
    db.refresh(staff)
    return UserResponse.model_validate(staff)


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_staff(
    staff_id: int,
    current_user: User = Depends(require_role(UserRole.OWNER)),
    db: Session = Depends(get_db),
):
    """Remove a staff member. Owner only."""
    staff = (
        db.query(User)
        .filter(
            User.id == staff_id,
            User.workspace_id == current_user.workspace_id,
            User.role == UserRole.STAFF,
            User.is_deleted == False,
        )
        .first()
    )
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )
    staff.is_deleted = True
    db.commit()

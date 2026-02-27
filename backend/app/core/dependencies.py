"""
Shared FastAPI dependencies for RBAC and workspace resolution.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.staff_permission import StaffPermission
from app.utils.enums import UserRole

# Map module name → StaffPermission column
_PERMISSION_FLAGS = {
    "inbox": "can_manage_inbox",
    "bookings": "can_manage_bookings",
    "forms": "can_manage_forms",
    "inventory": "can_view_inventory",
}


def require_role(*allowed_roles: UserRole):
    """
    Returns a dependency that enforces role-based access.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(UserRole.OWNER))])
    """

    def _role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(r.value for r in allowed_roles)}",
            )
        return current_user

    return _role_checker


def require_owner():
    """Dependency: Enforce OWNER role."""
    return require_role(UserRole.OWNER)


def require_permission(module: str):
    """
    Returns a dependency that enforces module-level permission.

    - Owners always pass.
    - Staff must have the corresponding flag in StaffPermission.

    Usage:
        @router.get("/inbox", dependencies=[Depends(require_permission("inbox"))])
    """
    flag = _PERMISSION_FLAGS.get(module)
    if flag is None:
        raise ValueError(f"Unknown permission module: {module}")

    def _permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        # Owners bypass permission checks
        if current_user.role == UserRole.OWNER:
            return current_user

        # Staff: look up permission row
        perm = db.query(StaffPermission).filter(
            StaffPermission.user_id == current_user.id
        ).first()

        if not perm or not getattr(perm, flag, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You do not have permission to access the {module} module.",
            )
        return current_user

    return _permission_checker


def get_current_workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Workspace:
    """Resolve the workspace for the current authenticated user."""
    workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return workspace


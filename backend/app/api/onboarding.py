"""
Onboarding API – workspace status and activation.
Owner-only endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.services.event_dispatcher import dispatch_event_background

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_workspace
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.onboarding import WorkspaceResponse, OnboardingStatus
from app.utils.enums import UserRole, WorkspaceStatus, AutomationEventType

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


from app.services.onboarding_service import OnboardingValidator

@router.get("/status", response_model=OnboardingStatus)
def get_onboarding_status(
    current_user: User = Depends(require_role(UserRole.OWNER)),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db),
):
    """Check onboarding progress for the current workspace."""
    has_owner = (
        db.query(User)
        .filter(User.workspace_id == workspace.id, User.role == UserRole.OWNER)
        .first()
        is not None
    )

    missing = OnboardingValidator.validate(workspace.id, db)

    steps_completed = {
        "workspace_created": True,
        "owner_registered": has_owner,
        "email_configured": "email" not in missing,
        "booking_configured": "booking" not in missing,
        "forms_configured": "form" not in missing,
        "inventory_configured": "inventory" not in missing,
        "workspace_activated": workspace.status == WorkspaceStatus.ACTIVE,
    }

    return OnboardingStatus(
        workspace=WorkspaceResponse.model_validate(workspace),
        has_owner=has_owner,
        is_active=workspace.status == WorkspaceStatus.ACTIVE,
        steps_completed=steps_completed,
        missing=missing,
    )


@router.post("/activate", response_model=WorkspaceResponse)
def activate_workspace(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(UserRole.OWNER)),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db),
):
    """Activate the workspace. Owner only. Requires all steps completed."""
    if workspace.status == WorkspaceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace is already active",
        )

    # Validate before activation
    missing = OnboardingValidator.validate(workspace.id, db)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Cannot activate workspace", "missing": missing},
        )

    workspace.status = WorkspaceStatus.ACTIVE
    db.commit()
    db.refresh(workspace)
    
    # Send welcome email asynchronously
    # Dispatch workspace activated event
    background_tasks.add_task(
        dispatch_event_background,
        workspace.id,
        AutomationEventType.WORKSPACE_ACTIVATED.value,
        current_user.id,
        {}
    )
    
    return WorkspaceResponse.model_validate(workspace)

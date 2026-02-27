"""
Onboarding schemas – workspace creation and status.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from app.utils.enums import WorkspaceStatus


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    status: WorkspaceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OnboardingStatus(BaseModel):
    workspace: WorkspaceResponse
    has_owner: bool
    is_active: bool  # Computed: workspace.status == ACTIVE
    steps_completed: dict
    missing: list[str] = []

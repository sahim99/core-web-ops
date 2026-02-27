"""
Alert schemas – Phase 3.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.utils.enums import AlertSeverity


class AlertResponse(BaseModel):
    id: int
    title: str
    message: Optional[str]
    severity: AlertSeverity
    is_read: bool
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlertCountResponse(BaseModel):
    count: int

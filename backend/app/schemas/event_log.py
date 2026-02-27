"""
Read-only response schema for audit trail viewing.
"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class EventLogResponse(BaseModel):
    id: int
    event_type: str
    source: Optional[str]
    triggered_by: Optional[str]
    status: str
    payload: Optional[Any]
    result: Optional[str]
    workspace_id: int
    created_at: datetime
    execution_ms: Optional[int] = None
    action_count: Optional[int] = None
    failed_action_count: Optional[int] = None

    class Config:
        from_attributes = True

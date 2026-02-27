"""
Event Logs API – Phase 3.
Read-only audit trail. Workspace-scoped.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.event_log import EventLog
from app.schemas.event_log import EventLogResponse

router = APIRouter(prefix="/event-logs", tags=["Event Logs"])


@router.get("/", response_model=list[EventLogResponse])
def list_event_logs(
    event_type: str = Query(None),
    source: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List event logs – read-only audit trail."""
    query = db.query(EventLog).filter(
        EventLog.workspace_id == current_user.workspace_id
    )

    if event_type:
        query = query.filter(EventLog.event_type == event_type)
    
    if source:
        # Flexible match or exact? User said source=automation. 
        # automation_engine logs source as "automation.{rule_key}".
        # So we should probably use ilike if source is just "automation".
        # Or user might pass "automation.booking_confirmation".
        # Let's use ilike for flexibility.
        query = query.filter(EventLog.source.ilike(f"{source}%"))

    logs = query.order_by(EventLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/{log_id}", response_model=EventLogResponse)
def get_event_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single event log detail."""
    log = (
        db.query(EventLog)
        .filter(
            EventLog.id == log_id,
            EventLog.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event log not found")
    return log

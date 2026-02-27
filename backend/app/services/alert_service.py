"""
Alert service – Phase 3.
Helper functions for creating and managing alerts.
All wrapped in try/except – never blocks the request.
"""

import logging
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.utils.enums import AlertSeverity

logger = logging.getLogger(__name__)


def create_alert(
    title: str,
    message: str,
    severity: AlertSeverity,
    workspace_id: int,
    db: Session,
) -> Alert | None:
    """Create an alert record. Returns the alert or None on failure."""
    try:
        alert = Alert(
            title=title,
            message=message,
            severity=severity,
            workspace_id=workspace_id,
        )
        db.add(alert)
        db.flush()
        logger.info(f"🔔 Alert created: [{severity.value}] {title} (workspace={workspace_id})")
        return alert
    except Exception as exc:
        logger.error(f"Failed to create alert: {exc}")
        return None


def dismiss_alert(
    alert_id: int,
    workspace_id: int,
    db: Session,
) -> bool:
    """Mark an alert as read/dismissed. Returns True on success."""
    try:
        alert = (
            db.query(Alert)
            .filter(Alert.id == alert_id, Alert.workspace_id == workspace_id)
            .first()
        )
        if not alert:
            return False
        alert.is_read = True
        db.flush()
        return True
    except Exception as exc:
        logger.error(f"Failed to dismiss alert: {exc}")
        return False

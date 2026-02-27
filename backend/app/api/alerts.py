"""
Alerts API – Phase 3.
Workspace-scoped, Owner/Staff access.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.models.inventory import InventoryItem
from app.schemas.alert import AlertResponse, AlertCountResponse
from app.services.alert_service import create_alert
from app.utils.enums import AlertSeverity

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=list[AlertResponse])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    show_all: bool = Query(False, description="Include already-dismissed alerts"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List alerts – unread first, then by newest. By default only shows unread alerts."""
    query = (
        db.query(Alert)
        .filter(Alert.workspace_id == current_user.workspace_id)
    )
    if not show_all:
        query = query.filter(Alert.is_read == False)
    alerts = (
        query
        .order_by(Alert.is_read.asc(), Alert.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return alerts


@router.get("/count", response_model=AlertCountResponse)
def get_alert_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get unread alert count."""
    count = (
        db.query(func.count(Alert.id))
        .filter(
            Alert.workspace_id == current_user.workspace_id,
            Alert.is_read == False,
        )
        .scalar()
    )
    return {"count": count or 0}


@router.post("/sync-inventory", status_code=status.HTTP_200_OK)
def sync_inventory_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scan all inventory items for the workspace and sync low-stock alerts:
    - Remove duplicate unread alerts for the same item (keep newest only)
    - Create one alert per low-stock item if none exists
    This endpoint is idempotent — safe to call multiple times.
    """
    items = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.workspace_id == current_user.workspace_id,
            InventoryItem.is_deleted == False,
        )
        .all()
    )

    created = 0
    for item in items:
        if item.low_stock_threshold is None:
            continue

        title = f"Low Stock: {item.name}"
        is_low = item.quantity <= item.low_stock_threshold

        # Find all unread alerts for this item title
        existing = (
            db.query(Alert)
            .filter(
                Alert.workspace_id == current_user.workspace_id,
                Alert.title == title,
                Alert.is_read == False,
            )
            .order_by(Alert.created_at.desc())
            .all()
        )

        if not is_low:
            # Item is no longer low-stock — auto-dismiss any lingering alerts
            for a in existing:
                a.is_read = True
            continue

        if len(existing) > 1:
            # Keep newest, delete the rest (dedup)
            for a in existing[1:]:
                db.delete(a)
        elif len(existing) == 0:
            # No alert yet — create one
            create_alert(
                title=title,
                message=(
                    f"{item.name} is down to {item.quantity} "
                    f"{item.unit or 'units'} (threshold: {item.low_stock_threshold})."
                ),
                severity=AlertSeverity.WARNING,
                workspace_id=current_user.workspace_id,
                db=db,
            )
            created += 1

    db.commit()
    return {"synced": created, "detail": f"{created} low-stock alert(s) created."}


@router.post("/{alert_id}/dismiss", status_code=status.HTTP_200_OK)
def dismiss_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an alert as read/dismissed."""
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
            Alert.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.is_read = True
    db.commit()
    return {"detail": "Alert dismissed"}


@router.post("/dismiss-all", status_code=status.HTTP_200_OK)
def dismiss_all_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss all unread alerts."""
    db.query(Alert).filter(
        Alert.workspace_id == current_user.workspace_id,
        Alert.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All alerts dismissed"}

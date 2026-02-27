"""
Dashboard API – Phase 4.
Owner-only, read-only, pre-aggregated workspace analytics.
No raw table dumps. All queries workspace-scoped.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.database import get_db
from app.core.security import require_owner
from app.models.user import User
from app.models.contact import Contact
from app.models.booking import Booking
from app.models.form import Form, FormSubmission
from app.models.inventory import InventoryItem
from app.models.conversation import Conversation
from app.models.alert import Alert
from app.models.event_log import EventLog
from app.utils.enums import BookingStatus, ContactSource, AlertSeverity
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── Helpers ──────────────────────────────────────────────────────

def _now_utc():
    return datetime.now(timezone.utc)


def _days_ago(days: int):
    return _now_utc() - timedelta(days=days)


def _start_of_week():
    """Monday 00:00 UTC of the current week."""
    now = _now_utc()
    return (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month():
    """First day of the current month, 00:00 UTC."""
    now = _now_utc()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


# ── 1. Overview KPIs ────────────────────────────────────────────

@router.get("/overview")
def get_overview(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """High-level workspace KPIs – aggregated via service."""
    from app.services.dashboard_service import get_overview_stats
    if hasattr(get_overview_stats, '__call__'):
        try:
            return get_overview_stats(current_user.workspace_id, db)
        except TypeError:
            # New service doesn't have get_overview_stats, use owner dashboard
            pass
    from app.services.dashboard_service import get_owner_dashboard
    data = get_owner_dashboard(current_user.workspace_id, db, range_days=7)
    return {**data["kpis"], **data["growth"], "health": data["health"], "revenue_trend": data["revenue_trend"], "pipeline": data["pipeline"]}


@router.get("/owner-overview")
def get_owner_overview(
    range: int = 7,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """
    Elite unified dashboard endpoint.
    Returns ALL dashboard data in a single call.
    Supports range=7, 30, 90 (days).
    """
    from app.services.dashboard_service import get_owner_dashboard
    allowed = [7, 30, 90]
    if range not in allowed:
        range = 7
    return get_owner_dashboard(current_user.workspace_id, db, range_days=range)


# ── 2. Contacts Analytics ───────────────────────────────────────

@router.get("/contacts")
def get_contacts_stats(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Contact analytics – totals, recency, source breakdown."""
    ws = current_user.workspace_id

    total = db.query(func.count(Contact.id)).filter(Contact.workspace_id == ws).scalar() or 0
    new_7d = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == ws, Contact.created_at >= _days_ago(7)
    ).scalar() or 0
    new_30d = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == ws, Contact.created_at >= _days_ago(30)
    ).scalar() or 0

    # Source breakdown using conditional aggregation
    source_rows = (
        db.query(Contact.source, func.count(Contact.id))
        .filter(Contact.workspace_id == ws)
        .group_by(Contact.source)
        .all()
    )
    by_source = {row[0].value if row[0] else "unknown": row[1] for row in source_rows}

    return {
        "total": total,
        "new_last_7_days": new_7d,
        "new_last_30_days": new_30d,
        "by_source": by_source,
    }


# ── 3. Bookings Analytics ───────────────────────────────────────

@router.get("/bookings")
def get_bookings_stats(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Booking analytics – status breakdown, recency, conversion rate."""
    ws = current_user.workspace_id

    total = db.query(func.count(Booking.id)).filter(Booking.workspace_id == ws).scalar() or 0

    # Status breakdown
    status_rows = (
        db.query(Booking.status, func.count(Booking.id))
        .filter(Booking.workspace_id == ws)
        .group_by(Booking.status)
        .all()
    )
    by_status = {row[0].value: row[1] for row in status_rows}
    # Ensure all statuses present
    for st in BookingStatus:
        by_status.setdefault(st.value, 0)

    this_week = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == ws, Booking.created_at >= _start_of_week()
    ).scalar() or 0

    this_month = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == ws, Booking.created_at >= _start_of_month()
    ).scalar() or 0

    # Conversion rate: (confirmed + completed) / total — safe divide
    converted = by_status.get("confirmed", 0) + by_status.get("completed", 0)
    conversion_rate = round(converted / total, 4) if total > 0 else 0.0

    return {
        "total": total,
        "by_status": by_status,
        "this_week": this_week,
        "this_month": this_month,
        "conversion_rate": conversion_rate,
    }


# ── 4. Inventory Health ─────────────────────────────────────────

@router.get("/inventory")
def get_inventory_stats(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Inventory health – totals, low-stock, out-of-stock list."""
    ws = current_user.workspace_id

    total_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == ws
    ).scalar() or 0

    # Low stock: quantity <= threshold (threshold is not null)
    low_stock_q = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.workspace_id == ws,
            InventoryItem.low_stock_threshold.isnot(None),
            InventoryItem.quantity <= InventoryItem.low_stock_threshold,
        )
    )
    low_stock_items = low_stock_q.count()
    low_stock_list = [
        {
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "threshold": item.low_stock_threshold,
        }
        for item in low_stock_q.limit(20).all()
    ]

    # Out of stock: quantity == 0
    out_of_stock = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == ws,
        InventoryItem.quantity == 0,
    ).scalar() or 0

    return {
        "total_items": total_items,
        "low_stock_items": low_stock_items,
        "out_of_stock_items": out_of_stock,
        "low_stock_list": low_stock_list,
    }


# ── 5. Alerts Summary ───────────────────────────────────────────

@router.get("/alerts")
def get_alerts_stats(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Alert summary – totals, severity breakdown, recent alerts."""
    ws = current_user.workspace_id

    total = db.query(func.count(Alert.id)).filter(Alert.workspace_id == ws).scalar() or 0
    unread = db.query(func.count(Alert.id)).filter(
        Alert.workspace_id == ws, Alert.is_read == False
    ).scalar() or 0

    # Severity breakdown
    severity_rows = (
        db.query(Alert.severity, func.count(Alert.id))
        .filter(Alert.workspace_id == ws)
        .group_by(Alert.severity)
        .all()
    )
    by_severity = {row[0].value: row[1] for row in severity_rows}
    for sev in AlertSeverity:
        by_severity.setdefault(sev.value, 0)

    # Top 5 most recent
    recent = (
        db.query(Alert)
        .filter(Alert.workspace_id == ws)
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total": total,
        "unread": unread,
        "by_severity": by_severity,
        "recent": [AlertResponse.model_validate(a) for a in recent],
    }

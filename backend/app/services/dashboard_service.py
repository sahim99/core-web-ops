"""
Dashboard Aggregation Service — v2 Elite.
Centralizes all dashboard metrics, single call, range-aware.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta, timezone

from app.models.booking import Booking
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.form import Form, FormSubmission
from app.models.inventory import InventoryItem
from app.models.alert import Alert
from app.models.event_log import EventLog
from app.utils.enums import BookingStatus, AlertSeverity


def _now_utc():
    return datetime.now(timezone.utc)


def _get_range_bounds(range_days: int):
    now = _now_utc()
    current_start = now - timedelta(days=range_days)
    prev_start = now - timedelta(days=range_days * 2)
    return now, current_start, prev_start


def get_owner_dashboard(workspace_id: int, db: Session, range_days: int = 7) -> dict:
    """
    Aggregates ALL dashboard metrics in a single call.
    Supports configurable date range (7, 30, 90 days).
    Returns KPIs, trends, pipeline, alerts — everything.
    """
    now, range_start, prev_start = _get_range_bounds(range_days)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # ── KPI Counts ──────────────────────────────────────────────
    total_contacts = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace_id,
        Contact.is_deleted == False
    ).scalar() or 0

    new_contacts_period = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace_id,
        Contact.is_deleted == False,
        Contact.created_at >= range_start
    ).scalar() or 0

    new_contacts_prev = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace_id,
        Contact.is_deleted == False,
        Contact.created_at >= prev_start,
        Contact.created_at < range_start
    ).scalar() or 0

    today_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.start_time >= today_start,
        Booking.start_time < today_start + timedelta(days=1),
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0

    pending_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.status == BookingStatus.PENDING
    ).scalar() or 0

    unread_alerts = db.query(func.count(Alert.id)).filter(
        Alert.workspace_id == workspace_id,
        Alert.is_read == False
    ).scalar() or 0

    total_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id
    ).scalar() or 0

    # ── Growth Calculations ──────────────────────────────────────
    prev_period_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= prev_start,
        Booking.created_at < range_start
    ).scalar() or 0

    curr_period_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= range_start
    ).scalar() or 0

    def _growth_pct(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    booking_growth = _growth_pct(curr_period_bookings, prev_period_bookings)
    contact_growth = _growth_pct(new_contacts_period, new_contacts_prev)

    # ── Revenue Trend (bookings per day in range) ────────────────
    daily_booking_rows = db.query(
        func.date(Booking.created_at).label('day'),
        func.count(Booking.id).label('bookings'),
        func.sum(
            case(
                (Booking.status == BookingStatus.CONFIRMED, 1),
                (Booking.status == BookingStatus.COMPLETED, 1),
                else_=0
            )
        ).label('confirmed')
    ).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= range_start,
        Booking.status != BookingStatus.CANCELLED
    ).group_by(
        func.date(Booking.created_at)
    ).order_by(
        func.date(Booking.created_at)
    ).all()

    # Fill in missing days with 0s
    date_map = {str(row.day): {"bookings": row.bookings, "confirmed": row.confirmed or 0}
                for row in daily_booking_rows}
    revenue_trend = []
    for i in range(range_days):
        day = (range_start + timedelta(days=i)).date()
        day_str = str(day)
        day_data = date_map.get(day_str, {"bookings": 0, "confirmed": 0})
        revenue_trend.append({
            "date": day_str,
            "bookings": day_data["bookings"],
            "confirmed": day_data["confirmed"],
            # Mocked revenue = confirmed * estimated value
            "revenue": day_data["confirmed"] * 150
        })

    # ── Bookings Status Breakdown (for Bar chart) ───────────────
    status_rows = db.query(
        Booking.status, func.count(Booking.id)
    ).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= range_start
    ).group_by(Booking.status).all()

    by_status = {row[0].value: row[1] for row in status_rows}
    for st in BookingStatus:
        by_status.setdefault(st.value, 0)

    # ── Pipeline / Conversion Funnel ────────────────────────────
    confirmed_or_completed = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).scalar() or 0

    conversion_rate = round((confirmed_or_completed / total_contacts) * 100, 1) if total_contacts > 0 else 0.0

    # ── Recent Alerts (unread only, deduplicated by title) ───────────
    # Get all unread alerts, then deduplicate keeping the newest per title
    all_unread = db.query(Alert).filter(
        Alert.workspace_id == workspace_id,
        Alert.is_read == False,
    ).order_by(Alert.created_at.desc()).all()

    # Deduplicate by title — keep only the first (newest) occurrence per title
    seen_titles = set()
    recent_alerts = []
    for a in all_unread:
        if a.title not in seen_titles:
            seen_titles.add(a.title)
            recent_alerts.append(a)
        if len(recent_alerts) >= 5:
            break

    critical_alerts = db.query(func.count(Alert.id)).filter(
        Alert.workspace_id == workspace_id,
        Alert.is_read == False,
        Alert.severity == AlertSeverity.CRITICAL
    ).scalar() or 0

    warning_alerts = db.query(func.count(Alert.id)).filter(
        Alert.workspace_id == workspace_id,
        Alert.is_read == False,
        Alert.severity == AlertSeverity.WARNING
    ).scalar() or 0

    # ── Inventory Health ─────────────────────────────────────────
    low_stock = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.is_deleted == False,
        InventoryItem.low_stock_threshold.isnot(None),
        InventoryItem.quantity <= InventoryItem.low_stock_threshold
    ).scalar() or 0

    # ── Operational Health Score ─────────────────────────────────
    # Score = 100, deductions based on alerts/pending/conversion
    score = 100
    if critical_alerts > 0:
        score -= min(30, critical_alerts * 10)
    if warning_alerts > 0:
        score -= min(10, warning_alerts * 3)
    if pending_bookings > 5:
        score -= min(20, (pending_bookings - 5) * 2)
    if conversion_rate < 10:
        score -= 15
    elif conversion_rate < 20:
        score -= 5
    if low_stock > 0:
        score -= min(15, low_stock * 5)
    score = max(0, min(100, score))

    # Health status label
    if score >= 80:
        health_status = "excellent"
    elif score >= 60:
        health_status = "good"
    elif score >= 40:
        health_status = "warning"
    else:
        health_status = "critical"

    # ── Unanswered Conversations ─────────────────────────────────
    unanswered = db.query(func.count(Conversation.id)).filter(
        Conversation.workspace_id == workspace_id,
        Conversation.is_read == False
    ).scalar() or 0

    active_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.workspace_id == workspace_id
    ).scalar() or 0

    # ── Forms Status ─────────────────────────────────────────────
    active_forms = db.query(func.count(Form.id)).filter(
        Form.workspace_id == workspace_id,
        Form.is_active == True
    ).scalar() or 0

    recent_submissions = db.query(func.count(FormSubmission.id)).filter(
        FormSubmission.workspace_id == workspace_id,
        FormSubmission.created_at >= range_start
    ).scalar() or 0

    # ── Inventory Status (Detailed) ──────────────────────────────
    total_inventory = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.is_deleted == False
    ).scalar() or 0

    out_of_stock = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.is_deleted == False,
        InventoryItem.quantity == 0
    ).scalar() or 0

    # Fetch actual inventory items for the dashboard list
    inventory_items_raw = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.is_deleted == False
    ).order_by(InventoryItem.name).all()

    inventory_items_list = []
    for item in inventory_items_raw:
        threshold = item.low_stock_threshold or 0
        qty = item.quantity or 0
        if qty == 0:
            item_status = "out_of_stock"
        elif threshold > 0 and qty <= threshold:
            item_status = "low_stock"
        else:
            item_status = "healthy"
        inventory_items_list.append({
            "id": item.id,
            "name": item.name,
            "sku": item.sku,
            "quantity": qty,
            "unit": item.unit or "",
            "threshold": threshold,
            "status": item_status,
        })


    return {
        # KPIs
        "kpis": {
            "today_bookings": today_bookings,
            "total_contacts": total_contacts,
            "pending_bookings": pending_bookings,
            "unread_alerts": unread_alerts,
            "total_bookings": total_bookings,
            "unanswered_conversations": unanswered,
        },
        # Growth indicators
        "growth": {
            "bookings": booking_growth,
            "contacts": contact_growth,
        },
        # Pipeline
        "pipeline": {
            "total_contacts": total_contacts,
            "new_contacts": new_contacts_period,
            "confirmed_bookings": confirmed_or_completed,
            "conversion_rate": conversion_rate,
        },
        # Booking status breakdown (for bar chart)
        "booking_status": by_status,
        # Revenue/booking trend (for line chart)
        "revenue_trend": revenue_trend,
        # Recent alerts list
        "alerts": [
            {
                "id": a.id,
                "title": a.title,
                "message": a.message,
                "severity": a.severity.value if hasattr(a.severity, "value") else str(a.severity),
                "is_read": a.is_read,
                "created_at": a.created_at.isoformat(),
            }
            for a in recent_alerts
        ],
        # Component specifically structured data
        "forms_status": {
            "active_forms": active_forms,
            "recent_submissions": recent_submissions,
        },
        "inventory_status": {
            "total_items": total_inventory,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "items": inventory_items_list,
        },
        "inbox_status": {
            "unanswered": unanswered,
            "active_conversations": active_conversations,
        },
        # Health score
        "health": {
            "score": score,
            "status": health_status,
            "low_stock_items": low_stock,
            "critical_alerts": critical_alerts,
        },
        # Meta
        "meta": {
            "range_days": range_days,
            "generated_at": now.isoformat(),
        }
    }

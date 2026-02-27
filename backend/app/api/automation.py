from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.dependencies import require_owner
from app.models.user import User
from app.models.event_log import EventLog
from app.services.automation_registry import AUTOMATION_RULES

router = APIRouter(prefix="/automation", tags=["Automation"])


from pydantic import BaseModel


# ── In-Memory Toggle Store (per workspace) ───────────────────────
# Key: "ws_{workspace_id}:{rule_key}" → bool
_rule_toggles: dict[str, bool] = {}

# Feature flags per workspace: "ws_{workspace_id}:feature:{name}" → bool
_feature_flags: dict[str, bool] = {}

FEATURES = [
    {"key": "customer_emails", "label": "Customer Emails", "description": "Send confirmation & welcome emails to customers", "category": "notifications"},
    {"key": "staff_sms_alerts", "label": "Staff SMS Alerts", "description": "Send SMS to staff on low inventory & critical failures", "category": "notifications"},
    {"key": "auto_thread_creation", "label": "Auto Thread Creation", "description": "Create conversation threads on bookings & form submissions", "category": "workflow"},
    {"key": "failure_retry", "label": "Auto-Retry on Failure", "description": "Retry failed actions up to 3 times before marking as failed", "category": "reliability"},
    {"key": "execution_logging", "label": "Detailed Execution Logs", "description": "Store payload & action details for every execution", "category": "observability"},
]


def _toggle_key(ws_id: int, rule_key: str) -> str:
    return f"ws_{ws_id}:{rule_key}"

def _feature_key(ws_id: int, feature: str) -> str:
    return f"ws_{ws_id}:feature:{feature}"

def is_rule_enabled(ws_id: int, rule_key: str) -> bool:
    return _rule_toggles.get(_toggle_key(ws_id, rule_key), True)  # default: enabled


class TogglePayload(BaseModel):
    enabled: bool


# ── Rules (with live metrics + toggle state) ─────────────────────

@router.get("/rules")
def get_rules(current_user: User = Depends(require_owner()), db: Session = Depends(get_db)):
    """Return all registered automation rules with execution stats (last 24h)."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)

    # Fetch per-rule stats in one query
    rule_stats = db.query(
        EventLog.source,
        func.count(EventLog.id).label("exec_count"),
        func.max(EventLog.created_at).label("last_triggered"),
        func.count(case((EventLog.status == "success", 1))).label("success_count"),
    ).filter(
        EventLog.workspace_id == current_user.workspace_id,
        EventLog.event_type.in_(["automation_executed", "automation_failed"]),
        EventLog.created_at >= since,
    ).group_by(EventLog.source).all()

    # Map: "automation.booking_confirmation" → stats
    stats_map = {}
    for row in rule_stats:
        rule_key = row.source.replace("automation.", "") if row.source else ""
        stats_map[rule_key] = {
            "exec_count_24h": row.exec_count,
            "last_triggered": row.last_triggered.isoformat() if row.last_triggered else None,
            "success_rate_24h": round((row.success_count / row.exec_count * 100), 1) if row.exec_count > 0 else 100,
        }

    return [
        {
            **r.dict(),
            "enabled": is_rule_enabled(current_user.workspace_id, r.key),
            "exec_count_24h": stats_map.get(r.key, {}).get("exec_count_24h", 0),
            "last_triggered": stats_map.get(r.key, {}).get("last_triggered", None),
            "success_rate_24h": stats_map.get(r.key, {}).get("success_rate_24h", 100),
        }
        for r in AUTOMATION_RULES
    ]


# ── Toggle Rule ──────────────────────────────────────────────────

@router.patch("/rules/{rule_key}/toggle")
def toggle_rule(
    rule_key: str,
    payload: TogglePayload,
    current_user: User = Depends(require_owner()),
):
    """Enable or disable an automation rule for this workspace."""
    valid_keys = {r.key for r in AUTOMATION_RULES}
    if rule_key not in valid_keys:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Rule '{rule_key}' not found")

    _rule_toggles[_toggle_key(current_user.workspace_id, rule_key)] = payload.enabled
    return {"rule_key": rule_key, "enabled": payload.enabled}


# ── Feature Flags ────────────────────────────────────────────────

@router.get("/features")
def get_features(current_user: User = Depends(require_owner())):
    """Get all feature flags for this workspace."""
    ws_id = current_user.workspace_id
    return [
        {
            **f,
            "enabled": _feature_flags.get(_feature_key(ws_id, f["key"]), True),
        }
        for f in FEATURES
    ]


@router.patch("/features/{feature_key}/toggle")
def toggle_feature(
    feature_key: str,
    payload: TogglePayload,
    current_user: User = Depends(require_owner()),
):
    """Toggle a feature flag for this workspace."""
    valid_keys = {f["key"] for f in FEATURES}
    if feature_key not in valid_keys:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Feature '{feature_key}' not found")

    _feature_flags[_feature_key(current_user.workspace_id, feature_key)] = payload.enabled
    return {"feature_key": feature_key, "enabled": payload.enabled}


# ── Legacy Metrics (kept for compat) ─────────────────────────────

@router.get("/metrics")
def get_metrics(current_user: User = Depends(require_owner()), db: Session = Depends(get_db)):
    """Return automation execution metrics (success vs failure)."""
    logs = db.query(EventLog.status, func.count(EventLog.id)).filter(
        EventLog.workspace_id == current_user.workspace_id,
        EventLog.event_type.in_(["automation_executed", "automation_failed"])
    ).group_by(EventLog.status).all()

    stats = {status: count for status, count in logs}
    success = stats.get("success", 0)
    failed = stats.get("error", 0) + stats.get("failed", 0)
    total = success + failed

    return {
        "total": total,
        "success": success,
        "failures": failed,
        "success_rate": round((success / total * 100), 1) if total > 0 else 100
    }


# ── Engine Status (aggregated, stateful) ─────────────────────────

@router.get("/engine-status")
def get_engine_status(current_user: User = Depends(require_owner()), db: Session = Depends(get_db)):
    """
    Aggregated engine status — single call for the dashboard header.
    Returns: engine state, metrics, throughput, latency stats.
    """
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)
    since_1h = now - timedelta(hours=1)

    ws_id = current_user.workspace_id

    # ── All-time metrics
    all_stats = db.query(
        func.count(EventLog.id).label("total"),
        func.count(case((EventLog.status == "success", 1))).label("success"),
    ).filter(
        EventLog.workspace_id == ws_id,
        EventLog.event_type.in_(["automation_executed", "automation_failed"]),
    ).first()

    total = all_stats.total or 0
    success = all_stats.success or 0
    failures = total - success
    success_rate = round((success / total * 100), 1) if total > 0 else 100

    # ── Latency stats (last 24h, max 500 events)
    latency_rows = db.query(EventLog.execution_ms).filter(
        EventLog.workspace_id == ws_id,
        EventLog.event_type == "automation_executed",
        EventLog.execution_ms.isnot(None),
        EventLog.created_at >= since_24h,
    ).order_by(desc(EventLog.created_at)).limit(500).all()

    exec_times = [r.execution_ms for r in latency_rows if r.execution_ms is not None]
    avg_latency = round(sum(exec_times) / len(exec_times)) if exec_times else 0
    p95_latency = sorted(exec_times)[int(len(exec_times) * 0.95)] if len(exec_times) >= 2 else avg_latency

    # ── Throughput (last hour)
    events_last_hour = db.query(func.count(EventLog.id)).filter(
        EventLog.workspace_id == ws_id,
        EventLog.event_type.in_(["automation_executed", "automation_failed"]),
        EventLog.created_at >= since_1h,
    ).scalar() or 0

    events_per_minute = round(events_last_hour / 60, 2)

    # ── Failures last 24h
    failures_24h = db.query(func.count(EventLog.id)).filter(
        EventLog.workspace_id == ws_id,
        EventLog.event_type == "automation_failed",
        EventLog.created_at >= since_24h,
    ).scalar() or 0

    # ── Events last 24h
    events_24h = db.query(func.count(EventLog.id)).filter(
        EventLog.workspace_id == ws_id,
        EventLog.event_type.in_(["automation_executed", "automation_failed"]),
        EventLog.created_at >= since_24h,
    ).scalar() or 0

    failure_rate_24h = round((failures_24h / events_24h * 100), 1) if events_24h > 0 else 0

    # ── Engine state (stateful)
    if failure_rate_24h > 25:
        engine_state = "error"
    elif failure_rate_24h > 10:
        engine_state = "degraded"
    else:
        engine_state = "running"

    return {
        "state": engine_state,
        "triggers": len(AUTOMATION_RULES),
        "integrations": 2,  # email + sms

        # Engine Metrics
        "total_events": total,
        "success": success,
        "failures": failures,
        "success_rate": success_rate,

        # Latency
        "avg_latency_ms": avg_latency,
        "p95_latency_ms": p95_latency,

        # Throughput
        "events_per_minute": events_per_minute,
        "events_24h": events_24h,
        "failures_24h": failures_24h,
        "failure_rate_24h": failure_rate_24h,
    }


# ── Failures ─────────────────────────────────────────────────────

@router.get("/failures")
def get_failures(current_user: User = Depends(require_owner()), db: Session = Depends(get_db)):
    """Return recent automation failures (last 10)."""
    failures = db.query(EventLog).filter(
        EventLog.workspace_id == current_user.workspace_id,
        EventLog.event_type.ilike("automation%"),
        EventLog.status.in_(["error", "failed"])
    ).order_by(EventLog.created_at.desc()).limit(10).all()

    return [
        {
            "id": f.id,
            "event_type": f.event_type,
            "status": f.status,
            "description": f.result or "No details",
            "created_at": f.created_at,
            "metadata": f.payload,
            "execution_ms": f.execution_ms,
        }
        for f in failures
    ]

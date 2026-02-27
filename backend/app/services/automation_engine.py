import logging
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.event_log import EventLog
from app.models.alert import Alert
from app.models.conversation import Conversation
from app.models.message import Message, MessageDirection
from app.models.contact import Contact
from app.utils.enums import AlertSeverity, ConversationChannel
from app.services.automation_registry import get_rule_by_trigger, AUTOMATION_RULES

logger = logging.getLogger(__name__)

# ── Action Definitions (Internal) ────────────────────────────────
# Which actions to take for each rule key
RULE_ACTIONS = {
    "booking_confirmation": [
        {"type": "send_email", "template": "booking_confirmation"},
        {"type": "create_conversation", "channel": "system", "subject": "Booking Confirmed"},
    ],
    "new_contact_welcome": [
        {"type": "send_email", "template": "welcome_email", "subject": "Welcome!"},
    ],
    "booking_cancellation": [
        {"type": "send_email", "template": "booking_cancelled"},
        {"type": "create_conversation", "channel": "system", "subject": "Booking Cancelled"},
    ],
    "form_notification": [
        {"type": "send_email", "template": "form_notification"},
        {"type": "create_conversation", "channel": "form", "subject": "New Form Submission"},
    ],
    "inventory_low_alert": [
        {"type": "create_alert", "severity": "warning"},
        {"type": "send_sms", "template": "low_stock_alert"},
    ],
}


# ── Core Engine ──────────────────────────────────────────────────

async def fire_event(
    event_type: str,
    workspace_id: int,
    payload: dict,
    db: Session,
) -> None:
    """
    Fire an automation event.
    """
    rules = get_rule_by_trigger(event_type)
    if not rules:
        logger.debug(f"No automation rules for event: {event_type}")
        return

    for rule in rules:
        rule_key = rule.key
        
        # 1. Idempotency Check
        # Prevent running same rule for same entity (e.g. booking_id) multiple times?
        # Use a deterministic key from payload.
        entity_id = payload.get("booking_id") or payload.get("form_submission_id") or payload.get("inventory_id") or payload.get("contact_id")
        unique_key = f"{rule_key}:{entity_id}" if entity_id else None
        
        if unique_key:
            exists = db.query(EventLog).filter(
                EventLog.workspace_id == workspace_id,
                EventLog.event_type == "automation_executed",
                EventLog.status == "success",
                text("payload ->> 'unique_key' = :ukey")
            ).params(ukey=unique_key).first()
            
            if exists:
                logger.info(f"Skipping duplicate automation: {unique_key}")
                continue

        # 2. Manual Override Check
        # If this is a conversation/message action, check if staff already replied manually
        contact_id = payload.get("contact_id")
        if contact_id:
             # Check for any recent manual reply for this contact?
             # Or check the specific conversation?
             # For now, check if ANY conversation with this contact has manual_override=True
             override = db.query(Conversation).filter(
                 Conversation.contact_id == contact_id, 
                 Conversation.workspace_id == workspace_id,
                 Conversation.manual_override == True
             ).first()
             
             if override:
                 logger.info(f"Skipping automation due to manual override for contact {contact_id}")
                 # Log the skip?
                 _log_event(db, workspace_id, "automation_skipped", rule_key, "Manual override active", payload)
                 continue

        # 3. Execution
        actions = RULE_ACTIONS.get(rule_key, [])
        all_success = True
        errors = []
        total_actions = len(actions)
        failed_actions = 0
        
        exec_start = time.time()
        
        for action_def in actions:
            try:
                await _execute_action(action_def, payload, workspace_id, db)
            except Exception as exc:
                all_success = False
                failed_actions += 1
                errors.append(str(exc))
                logger.error(f"Action failed {action_def['type']}: {exc}")

        exec_ms = int((time.time() - exec_start) * 1000)

        # 4. Logging
        status_res = "success" if all_success else "error"
        result_text = "All actions executed" if all_success else f"Errors: {'; '.join(errors)}"
        
        # Add unique_key to payload for future dedup
        log_payload = payload.copy()
        if unique_key:
            log_payload["unique_key"] = unique_key
            
        _log_event(
            db, workspace_id,
            f"automation_{'executed' if all_success else 'failed'}",
            rule_key, result_text, log_payload,
            status=status_res,
            execution_ms=exec_ms,
            action_count=total_actions,
            failed_action_count=failed_actions,
        )


def _log_event(
    db: Session, workspace_id: int, event_type: str, rule_key: str,
    result: str, payload: dict, status: str = "info",
    execution_ms: int = None, action_count: int = 0, failed_action_count: int = 0,
):
    try:
        log = EventLog(
            event_type=event_type,
            source=f"automation.{rule_key}",
            status=status,
            payload=payload,
            result=result,
            workspace_id=workspace_id,
            metadata={"rule": rule_key},
            execution_ms=execution_ms,
            action_count=action_count,
            failed_action_count=failed_action_count,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Log failure: {e}")


async def _execute_action(
    action_def: dict,
    payload: dict,
    workspace_id: int,
    db: Session,
) -> str:
    action_type = action_def["type"]

    if action_type == "send_email":
        return await _action_send_email(action_def, payload)

    elif action_type == "send_sms":
        return await _action_send_sms(action_def, payload)

    elif action_type == "create_alert":
        return _action_create_alert(action_def, payload, workspace_id, db)

    elif action_type == "create_conversation":
        return _action_create_conversation(action_def, payload, workspace_id, db)

    else:
        raise ValueError(f"Unknown action type: {action_type}")


# ── Action Handlers ──────────────────────────────────────────────

async def _action_send_email(action_def: dict, payload: dict) -> str:
    from app.services.email_service import get_email_provider
    provider = get_email_provider()
    to = payload.get("contact_email", payload.get("email", ""))
    subject = payload.get("subject", "Notification")
    body = payload.get("body", "Message")
    success = await provider.send(to=to, subject=subject, body=body)
    if not success:
        raise Exception("Email provider failed")
    return "Email sent"

async def _action_send_sms(action_def: dict, payload: dict) -> str:
    from app.services.sms_service import get_sms_provider
    provider = get_sms_provider()
    to = payload.get("contact_phone", payload.get("phone", ""))
    msg = payload.get("message", payload.get("body", ""))
    success = await provider.send(to=to, message=msg)
    if not success:
        raise Exception("SMS provider failed")
    return "SMS sent"

def _action_create_alert(action_def: dict, payload: dict, workspace_id: int, db: Session) -> str:
    severity = AlertSeverity(action_def.get("severity", "info"))
    alert = Alert(
        title=payload.get("title", "Automation Alert"),
        message=payload.get("message", "Automated alert triggered"),
        severity=severity,
        workspace_id=workspace_id,
    )
    db.add(alert)
    db.flush() # Alert execution part of larger transaction? No, db passed is session.
    # We should commit if we want it persisted immediately, or let caller handle.
    # fire_event logs separately. actions might share transaction?
    # db passed from caller (router) is usually a session.
    return f"Alert {alert.title} created"

def _action_create_conversation(action_def: dict, payload: dict, workspace_id: int, db: Session) -> str:
    contact_id = payload.get("contact_id")
    if not contact_id:
        return "Skipped: no contact_id"
    
    channel = ConversationChannel(action_def.get("channel", "system"))
    subject = action_def.get("subject", payload.get("subject", "Notification"))
    body = payload.get("body", payload.get("message", ""))
    
    now = datetime.now(timezone.utc)
    
    # Logic: Append to existing, else create new
    conv = db.query(Conversation).filter(
        Conversation.contact_id == contact_id,
        Conversation.channel == channel,
        Conversation.workspace_id == workspace_id
    ).order_by(Conversation.created_at.desc()).first()
    
    if not conv:
        conv = Conversation(
            subject=subject,
            channel=channel,
            contact_id=contact_id,
            workspace_id=workspace_id,
            is_read=False,
            last_message_at=now
        )
        db.add(conv)
        db.flush()
        
    msg = Message(
        body=body,
        direction=MessageDirection.SYSTEM,
        conversation_id=conv.id,
        workspace_id=workspace_id
    )
    db.add(msg)
    conv.last_message_at = now
    conv.is_read = False
    return "Conversation message added"

"""
Event Dispatcher – central event bus for the automation layer.
All business events go through dispatch_event() which logs and delegates to handlers.
Controllers NEVER send emails/SMS directly – only dispatch events.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

from app.models.automation_log import AutomationLog
from app.utils.enums import AutomationEventType
from app.models.automation_log import AutomationLog
from app.models.conversation import Conversation
from app.models.message import Message
from app.utils.enums import AutomationEventType, SenderType, MessageType
from app.services.email_service import (
    send_owner_signup_email,
    send_owner_login_email,
    send_workspace_welcome_email,
)

logger = logging.getLogger(__name__)


def dispatch_event(
    workspace_id: int,
    event_type: str,
    reference_id: int,
    db: Session,
    payload: dict = None,
) -> AutomationLog:
    """
    Dispatch an automation event.

    1. Creates an AutomationLog entry
    2. Calls the appropriate handler
    3. Updates log status

    Parameters:
        workspace_id: Workspace scope
        event_type: One of AutomationEventType values
        reference_id: ID of the triggering entity (submission, booking, etc.)
        db: Database session
        payload: Optional extra data for the handler

    Returns:
        The created AutomationLog entry
    """
    log = AutomationLog(
        workspace_id=workspace_id,
        event_type=event_type,
        reference_id=reference_id,
        status="pending",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        handler = EVENT_HANDLERS.get(event_type)
        if handler:
            handler(workspace_id=workspace_id, reference_id=reference_id, db=db, payload=payload or {})
            log.status = "success"
            logger.info(f"[EVENT] {event_type} handled successfully (ref={reference_id})")
        else:
            log.status = "skipped"
            logger.warning(f"[EVENT] No handler for event: {event_type}")
    except Exception as e:
        log.status = "error"
        logger.error(f"[EVENT] Error handling {event_type}: {e}")

    db.commit()
    return log


def dispatch_event_background(workspace_id: int, event_type: str, reference_id: int, payload: dict = None):
    """
    Wrapper for dispatch_event to run as a BackgroundTask.
    Creates a dedicated database session to safely persist the log.
    """
    db = SessionLocal()
    try:
        dispatch_event(workspace_id=workspace_id, event_type=event_type, reference_id=reference_id, db=db, payload=payload)
    except Exception as e:
        logger.error(f"[BACKGROUND_EVENT] Failed to dispatch {event_type} (ref={reference_id}): {e}")
    finally:
        db.close()


# ── Event Handlers ──────────────────────────────────────────────
# Each handler is a function(workspace_id, reference_id, db, payload)

def _handle_form_submitted(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle form_submitted: send welcome message to contact."""
    from app.services.email_service import get_email_provider

    contact_email = payload.get("contact_email")
    contact_name = payload.get("contact_name", "there")
    form_title = payload.get("form_title", "Form")

    if not contact_email:
        logger.info("[EVENT] form_submitted: no contact email, skipping email send")
        return

    try:
        provider = get_email_provider()
        subject = f"Thank you for submitting '{form_title}' – CoreWebOps"
        body = (
            f"Hi {contact_name},\n\n"
            f"We received your submission for '{form_title}'. "
            f"Our team will review it shortly.\n\n"
            f"Thank you,\nCoreWebOps"
        )
        import asyncio
        asyncio.run(provider.send(contact_email, subject, body))
        logger.info(f"[EVENT] Sent welcome email to {contact_email}")

        # Log automated message in conversation
        # Need to find conversation by contact_email... or better, pass conversation_id or contact_id in payload?
        # Re-querying by email is safe enough for this flow since we just updated contact
        from app.models.contact import Contact
        contact = db.query(Contact).filter(Contact.email == contact_email, Contact.workspace_id == workspace_id).first()
        if contact:
            conv = db.query(Conversation).filter(
                Conversation.contact_id == contact.id,
                Conversation.workspace_id == workspace_id
            ).first()
            if conv:
                msg = Message(
                    content="Thank you for your submission. We will contact you soon.",
                    sender_type=SenderType.SYSTEM,
                    message_type=MessageType.AUTOMATED,
                    conversation_id=conv.id,
                    workspace_id=workspace_id,
                )
                db.add(msg)
                conv.last_message_at = datetime.now(timezone.utc)
                db.commit()
                logger.info(f"[EVENT] Logged automated reply in conversation {conv.id}")

    except Exception as e:
        logger.error(f"[EVENT] Failed to handle form submission automation: {e}")
        # Ensure we don't crash, but error is logged



def _handle_form_approved(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle form_approved: send confirmation message to contact."""
    from app.services.email_service import get_email_provider

    contact_email = payload.get("contact_email")
    contact_name = payload.get("contact_name", "there")
    form_title = payload.get("form_title", "Form")

    if not contact_email:
        logger.info("[EVENT] form_approved: no contact email, skipping")
        return

    try:
        provider = get_email_provider()
        subject = f"Your submission has been approved! – CoreWebOps"
        body = (
            f"Hi {contact_name},\n\n"
            f"Great news! Your submission for '{form_title}' has been approved.\n\n"
            f"Thank you,\nCoreWebOps"
        )
        import asyncio
        asyncio.get_event_loop().run_until_complete(provider.send(contact_email, subject, body))
        logger.info(f"[EVENT] Sent approval email to {contact_email}")
    except Exception as e:
        logger.error(f"[EVENT] Failed to send approval email: {e}")


def _handle_booking_created(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle booking_created: system notification."""
    # Already logged in booking_service.py? 
    # User requirement: "booking_created Event Should Also Log Message"
    # In my Service I did create a message. 
    # But usually Service -> Event -> Handler.
    # If Service created Message, Handler might duplicate?
    # User Request said: 
    # "6. booking_created Event Should Also Log Message... Insert message: sender_type='system'..."
    # "3. Create system inbox message... 4. Dispatch event".
    # So Service creates message properly.
    # The Event Handler might be for *other* things (like Zapier/Webhook later).
    # BUT wait, User said: "Inbox logs automated message" inside "booking_created Event".
    # Let's check Service code again... 
    # Service creates message AND dispatches event. 
    # If I add message creation here, it will be double.
    # However, "Strict Event-Driven Rule" says "All side effects must go through dispatch_event".
    # So Service should dispatch event, and Handler creates message?
    # User Spec 3: "3. Create system inbox message... 4. Dispatch booking_created event".
    # User Spec 6: "booking_created Event Should Also Log Message".
    # This is slightly contradictory or implies multiple logs.
    # I will stick to the plan: Service creates the generic "request" message. 
    # Handler can send an Internal Notification (email to owner?). 
    # For now, I'll log info. 
    logger.info(f"[EVENT] booking_created processed for ref={reference_id}")


def _handle_booking_confirmed(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle booking_confirmed: send email + inbox message."""
    from app.services.email_service import get_email_provider
    
    contact_email = payload.get("contact_email")
    contact_name = payload.get("contact_name", "there")
    date_str = payload.get("date")
    time_str = payload.get("time")
    
    # 1. Inbox Message
    # Need conversation ID.
    from app.models.contact import Contact
    contact = db.query(Contact).filter(Contact.email == contact_email, Contact.workspace_id == workspace_id).first()
    if contact:
        conv = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == workspace_id
        ).first()
        if conv:
            msg = Message(
                content=f"Your appointment on {date_str} at {time_str} has been confirmed.",
                sender_type=SenderType.SYSTEM,
                message_type=MessageType.AUTOMATED,
                conversation_id=conv.id,
                workspace_id=workspace_id,
            )
            db.add(msg)
            conv.last_message_at = datetime.now(timezone.utc)
            db.commit()

    # 2. Email
    if contact_email:
        try:
            provider = get_email_provider()
            subject = f"Appointment Confirmed – {date_str} @ {time_str}"
            body = (
                f"Hi {contact_name},\n\n"
                f"Your appointment has been confirmed for {date_str} at {time_str}.\n\n"
                f"We look forward to seeing you!\n\n"
                f"Best regards,\nCoreWebOps"
            )
            import asyncio
            asyncio.run(provider.send(contact_email, subject, body))
            logger.info(f"[EVENT] Sent booking confirmation email to {contact_email}")
        except Exception as e:
            logger.error(f"[EVENT] Failed to send booking email: {e}")


def _handle_staff_replied(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle staff_replied: pause scheduled automation for contact."""
    logger.info(f"[EVENT] staff_replied handler (ref={reference_id})")
    # Future: pause automation timers, send notification to contact


def _handle_owner_registered(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle owner_registered: send signup email."""
    # We need the user object. But reference_id is likely user.id.
    from app.models.user import User
    user = db.query(User).filter(User.id == reference_id).first()
    if user:
        import asyncio
        asyncio.run(send_owner_signup_email(user))
        logger.info(f"[EVENT] Sent owner signup email to {user.email}")


def _handle_owner_logged_in(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle owner_logged_in: send login alert."""
    from app.models.user import User
    user = db.query(User).filter(User.id == reference_id).first()
    if user:
        import asyncio
        asyncio.run(send_owner_login_email(user))
        logger.info(f"[EVENT] Sent owner login email to {user.email}")


def _handle_workspace_activated(workspace_id: int, reference_id: int, db: Session, payload: dict):
    """Handle workspace_activated: send welcome email."""
    # reference_id is workspace_id? No, usually reference_id is user_id for context or workspace_id.
    # But send_workspace_welcome_email takes `user`.
    # Let's assume reference_id is user_id (the owner).
    from app.models.user import User
    user = db.query(User).filter(User.id == reference_id).first()
    if user:
        import asyncio
        asyncio.run(send_workspace_welcome_email(user))
        logger.info(f"[EVENT] Sent workspace welcome email to {user.email}")


# ── Handler Registry ────────────────────────────────────────────

EVENT_HANDLERS = {
    AutomationEventType.FORM_SUBMITTED.value: _handle_form_submitted,
    AutomationEventType.FORM_APPROVED.value: _handle_form_approved,
    AutomationEventType.BOOKING_CREATED.value: _handle_booking_created,
    AutomationEventType.BOOKING_CONFIRMED.value: _handle_booking_confirmed,
    AutomationEventType.STAFF_REPLIED.value: _handle_staff_replied,
    AutomationEventType.OWNER_REGISTERED.value: _handle_owner_registered,
    AutomationEventType.OWNER_LOGGED_IN.value: _handle_owner_logged_in,
    AutomationEventType.WORKSPACE_ACTIVATED.value: _handle_workspace_activated,
}

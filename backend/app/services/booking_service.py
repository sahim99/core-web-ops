import logging
import re
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.booking import Booking
from app.models.form import Form, FormSubmission
from app.models.form_field import FormField
from app.models.contact import Contact
from app.models.message import Message
from app.utils.enums import BookingStatus, SenderType, MessageType, AutomationEventType, FieldType
from app.services.event_dispatcher import dispatch_event

logger = logging.getLogger(__name__)


def _parse_time_string(time_str: str) -> tuple:
    """Parse a time string into (hour, minute). Returns (None, None) on failure."""
    time_str = (time_str or "").strip()
    if not time_str:
        return None, None

    # Try ISO time (HH:MM or HH:MM:SS)
    m = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$", time_str)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        return h % 24, mi

    # Try 12-hour with AM/PM (e.g., "2:00 PM", "10:30 am")
    m = re.match(r"(?i)^(\d{1,2}):(\d{2})\s*(am|pm)$", time_str)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        ampm = m.group(3).lower()
        if ampm == "pm" and h != 12:
            h += 12
        elif ampm == "am" and h == 12:
            h = 0
        return h % 24, mi

    # Try just a number (e.g., "14" -> 14:00, "6" -> 06:00)
    m = re.match(r"^(\d{1,2})$", time_str)
    if m:
        return int(m.group(1)) % 24, 0

    return None, None


def _parse_date_string(date_str: str) -> datetime:
    """
    Parse a date string into a datetime. Supports:
    - ISO format: 2026-02-25, 2026-02-25T18:00:00
    - Common formats: 02/25/2026, 25-02-2026
    Returns None on failure.
    """
    date_str = (date_str or "").strip()
    if not date_str:
        return None

    # ISO datetime with T
    if "T" in date_str:
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            pass

    # Try common formats
    formats = [
        "%Y-%m-%d",      # 2026-02-25
        "%m/%d/%Y",      # 02/25/2026
        "%d-%m-%Y",      # 25-02-2026
        "%d/%m/%Y",      # 25/02/2026
        "%Y/%m/%d",      # 2026/02/25
        "%b %d, %Y",     # Feb 25, 2026
        "%B %d, %Y",     # February 25, 2026
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    # Last resort: try fromisoformat
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        return None


class BookingService:
    @staticmethod
    def create_from_submission(
        db: Session,
        form: Form,
        submission: FormSubmission,
        answers: dict,
        contact: Contact,
        conversation: "Conversation" = None
    ) -> Booking:
        """
        Creates a pending booking from a form submission.
        Extracts date/time from form answers by detecting field labels.
        """
        # Ensure form.fields is loaded (query explicitly if needed)
        fields = form.fields
        if not fields:
            fields = db.query(FormField).filter(FormField.form_id == form.id).all()
            logger.info(f"Explicitly loaded {len(fields)} fields for form {form.id}")

        field_by_id = {f.id: f for f in fields}

        # ── Extract date, time, schedule from answers ──
        date_value = None
        time_value = None
        schedule_value = None  # Combined date-time field
        schedule_notes = []

        # Priority 0: Meta-defined fields (Strict Mode)
        if form.meta:
            date_fid = form.meta.get("booking_date_field_id")
            time_fid = form.meta.get("booking_time_field_id")
            
            if date_fid:
                val = answers.get(str(date_fid))
                if val:
                    date_value = str(val).strip()
                    logger.info(f"Extracted DATE from meta field {date_fid}: {date_value}")
            
            if time_fid:
                val = answers.get(str(time_fid))
                if val:
                    time_value = str(val).strip()
                    logger.info(f"Extracted TIME from meta field {time_fid}: {time_value}")

        for field_id_str, value in answers.items():
            try:
                field_id = int(field_id_str)
            except (ValueError, TypeError):
                continue

            value_str = str(value).strip() if value else ""
            if not value_str:
                continue

            field = field_by_id.get(field_id)
            if not field:
                continue

            # If we already have meta-extracted values, skip matching for those specific types
            # But we still want to collect notes/schedule if not found
            
            label = field.label.lower()
            logger.debug(f"Processing field: label='{field.label}', type={field.field_type}, value='{value_str}'")

            # Skip heuristics if we found explicit meta values
            if date_value and time_value:
                if "notes" in label or "description" in label:
                    schedule_notes.append(f"{field.label}: {value_str}")
                continue

            # Priority 1: Explicit DATE field type
            if not date_value and field.field_type == FieldType.DATE:
                date_value = value_str
                logger.info(f"Found DATE field: '{field.label}' = '{value_str}'")

            # Priority 2: Label contains "date" but NOT "time" (avoid "date and time" combos)
            elif not date_value and "date" in label and "time" not in label:
                date_value = value_str
                logger.info(f"Found date-like field: '{field.label}' = '{value_str}'")

            # Priority 3: Label contains "time" (preferred time, time slot, etc.)
            elif not time_value and "time" in label:
                time_value = value_str
                logger.info(f"Found time field: '{field.label}' = '{value_str}'")

            # Priority 4: Label is exactly "schedule" or contains "schedule"
            elif "schedule" in label:
                schedule_value = value_str
                schedule_notes.append(f"{field.label}: {value_str}")
                logger.info(f"Found schedule field: '{field.label}' = '{value_str}'")

            # Priority 5: Label contains appointment/when/day
            elif not date_value and any(x in label for x in ["appointment", "when", "day"]):
                date_value = value_str
                logger.info(f"Found date-like field (heuristic): '{field.label}' = '{value_str}'")

            # Collect notes
            elif "notes" in label or "description" in label or "message" in label:
                schedule_notes.append(f"{field.label}: {value_str}")

        # ── Build start_time / end_time ──
        start_time = None
        end_time = None

        # Try schedule_value first (combined date+time), if it looks like a datetime
        if schedule_value and not date_value:
            parsed = _parse_date_string(schedule_value)
            if parsed:
                start_time = parsed
                logger.info(f"Using schedule field as datetime: {start_time}")

        # Use date_value as primary
        if date_value:
            parsed = _parse_date_string(date_value)
            if parsed:
                start_time = parsed
                logger.info(f"Parsed date: {start_time}")
            else:
                logger.warning(f"Could not parse date value: '{date_value}'")

        # Apply time to the parsed date
        if start_time and time_value:
            hour, minute = _parse_time_string(time_value)
            if hour is not None:
                start_time = start_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                logger.info(f"Applied time {hour}:{minute:02d} -> start_time={start_time}")
            else:
                logger.warning(f"Could not parse time value: '{time_value}'")
        elif start_time and not time_value:
            # No time given: check if datetime already has time component
            if start_time.hour == 0 and start_time.minute == 0:
                # Use noon as default so it's visible on calendar
                start_time = start_time.replace(hour=12, minute=0, second=0, microsecond=0)
                logger.info(f"No time given, defaulting to noon: {start_time}")

        # Ensure timezone
        if start_time and start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        # Default duration: 1 hour
        if start_time:
            end_time = start_time + timedelta(hours=1)

        # ── Build description ──
        desc_parts = [f"Automated booking from form submission #{submission.id}"]
        if schedule_notes:
            desc_parts.append(" | ".join(schedule_notes))

        logger.info(f"Creating booking: start_time={start_time}, end_time={end_time}, date_value='{date_value}', time_value='{time_value}'")

        # ── Create Booking ──
        booking = Booking(
            workspace_id=form.workspace_id,
            contact_id=contact.id,
            form_submission_id=submission.id,
            title=f"Booking: {form.title}",
            description=" ".join(desc_parts),
            start_time=start_time,
            end_time=end_time,
            status=BookingStatus.PENDING,
            timezone="UTC"
        )
        db.add(booking)
        db.flush()

        # ── Dispatch Event ──
        try:
            dispatch_event(
                workspace_id=form.workspace_id,
                event_type=AutomationEventType.BOOKING_CREATED.value,
                reference_id=booking.id,
                db=db,
                payload={
                    "contact_email": contact.email,
                    "contact_name": contact.name if contact else "Unknown",
                    "date": start_time.strftime("%Y-%m-%d") if start_time else "TBD",
                    "time": start_time.strftime("%H:%M") if start_time else "TBD",
                    "booking_title": form.title,
                }
            )
        except Exception as e:
            logger.error(f"Failed to dispatch booking event: {e}")

        return booking

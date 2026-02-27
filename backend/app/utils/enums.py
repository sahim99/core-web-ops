"""
Enums used across the Core Web Ops platform.
"""

import enum


# ── Existing Enums (unchanged) ──────────────────────────────────

class UserRole(str, enum.Enum):
    """Roles for internal users."""
    OWNER = "owner"
    STAFF = "staff"


class WorkspaceStatus(str, enum.Enum):
    SETUP = "setup"
    EMAIL_CONNECTED = "email_connected"
    BOOKING_CONFIGURED = "booking_configured"
    FORMS_LINKED = "forms_linked"
    INVENTORY_READY = "inventory_ready"
    STAFF_ADDED = "staff_added"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class ContactSource(str, enum.Enum):
    """How a contact entered the system."""
    CONTACT_FORM = "contact_form"
    BOOKING = "booking"
    FORM = "form"
    MANUAL = "manual"
    IMPORT = "import"
    ONBOARDING = "onboarding"


class BookingStatus(str, enum.Enum):
    """Booking lifecycle status."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ConversationChannel(str, enum.Enum):
    """Communication channel for conversations."""
    EMAIL = "email"
    SMS = "sms"
    FORM = "form"
    SYSTEM = "system"


class AlertSeverity(str, enum.Enum):
    """Severity levels for alerts."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class EventAction(str, enum.Enum):
    """Event actions for the automation engine."""
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    CREATE_ALERT = "create_alert"
    UPDATE_INVENTORY = "update_inventory"


# ── New Enums (Phase 1 Refactor) ────────────────────────────────

class ContactType(str, enum.Enum):
    """Category of a contact in the CRM."""
    CUSTOMER = "customer"
    PROVIDER = "provider"
    VENDOR = "vendor"


class SenderType(str, enum.Enum):
    """Who sent a message."""
    BUSINESS = "business"
    CONTACT = "contact"
    SYSTEM = "system"


class MessageType(str, enum.Enum):
    """Type/purpose of a message."""
    MANUAL = "manual"
    AUTOMATED = "automated"
    FORM_SUBMISSION = "form_submission"
    APPROVAL = "approval"
    BOOKING = "booking"


class FormPurpose(str, enum.Enum):
    """Purpose of a dynamic form."""
    LEAD_CAPTURE = "LEAD_CAPTURE"
    INQUIRY = "INQUIRY"
    ONBOARDING = "ONBOARDING"
    SUPPORT = "SUPPORT"
    CUSTOM = "CUSTOM"
    CONTACT = "CONTACT"
    BOOKING = "BOOKING"


class FormStatus(str, enum.Enum):
    """Lifecycle status of a form."""
    DRAFT = "draft"
    ACTIVE = "active"


class SubmissionStatus(str, enum.Enum):
    """Review status of a form submission."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"



class FieldType(str, enum.Enum):
    """Supported field types for dynamic forms."""
    TEXT = "TEXT"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    TEXTAREA = "TEXTAREA"
    SELECT = "SELECT"
    DATE = "DATE"


class AutomationEventType(str, enum.Enum):
    """Events that trigger automation handlers."""
    FORM_SUBMITTED = "form_submitted"
    FORM_APPROVED = "form_approved"
    OWNER_REGISTERED = "owner_registered"
    OWNER_LOGGED_IN = "owner_logged_in"
    WORKSPACE_ACTIVATED = "workspace_activated"
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    STAFF_REPLIED = "staff_replied"

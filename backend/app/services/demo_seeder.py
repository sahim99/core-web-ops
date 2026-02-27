"""
Demo Account Seeder
====================
Seeds realistic fake data into the demo workspace so every page of the
app feels lived-in. Called once on first demo login (idempotent).

Seeded records:
  - 20 Contacts  (customers, 2 providers, 2 vendors)
  - 8  Inventory items (matches the dashboard widget data)
  - 12 Bookings  (mix of confirmed/completed/pending/cancelled)
  - 12 Conversations + messages (matches contacts, mix of read/unread)
  - 4  Forms
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.booking import Booking
from app.models.inventory import InventoryItem
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.form import Form
from app.models.alert import Alert
from app.models.automation_log import AutomationLog
from app.utils.enums import (
    ContactSource, ContactType,
    BookingStatus,
    ConversationChannel,
    SenderType, MessageType,
    FormPurpose, FormStatus,
    AlertSeverity,
)


# ── Helpers ────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _days_ago(n: int) -> datetime:
    return _now() - timedelta(days=n)

def _days_from_now(n: int) -> datetime:
    return _now() + timedelta(days=n)


# ── Seed data blueprints ───────────────────────────────────────────

CONTACTS_DATA = [
    # Customers (booking clients)
    { "name": "Isabelle Fontaine",  "email": "isabelle.fontaine@gmail.com",   "phone": "+14155551001", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Marcus Webb",        "email": "marcus.webb@outlook.com",        "phone": "+14155551002", "type": ContactType.CUSTOMER, "source": ContactSource.FORM       },
    { "name": "Priya Sharma",       "email": "priya.sharma@yahoo.com",         "phone": "+14155551003", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Jordan Cole",        "email": "jordan.cole@company.io",         "phone": "+14155551004", "type": ContactType.CUSTOMER, "source": ContactSource.MANUAL     },
    { "name": "Leila Hassan",       "email": "leila.hassan@email.com",         "phone": "+14155551005", "type": ContactType.CUSTOMER, "source": ContactSource.FORM       },
    { "name": "Ethan Morales",      "email": "ethan.morales@gmail.com",        "phone": "+14155551006", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Sophie Turner",      "email": "sophie.turner@protonmail.com",   "phone": "+14155551007", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Kai Nakamura",       "email": "kai.nakamura@studio.com",        "phone": "+14155551008", "type": ContactType.CUSTOMER, "source": ContactSource.MANUAL     },
    { "name": "Amara Johnson",      "email": "amara.johnson@hmail.com",        "phone": "+14155551009", "type": ContactType.CUSTOMER, "source": ContactSource.FORM       },
    { "name": "Remy Dumont",        "email": "remy.dumont@paris.fr",           "phone": "+14155551010", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Nora Fitzgerald",    "email": "nora.fitz@enterprise.co",        "phone": "+14155551011", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Daniel Osei",        "email": "daniel.osei@gmail.com",          "phone": "+14155551012", "type": ContactType.CUSTOMER, "source": ContactSource.MANUAL     },
    { "name": "Valentina Cruz",     "email": "v.cruz@globalevents.com",        "phone": "+14155551013", "type": ContactType.CUSTOMER, "source": ContactSource.FORM       },
    { "name": "Ahmed Al-Rashid",    "email": "ahmed.alrashid@corp.ae",         "phone": "+14155551014", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Charlotte Lawson",   "email": "charlotte.l@luxe.events",        "phone": "+14155551015", "type": ContactType.CUSTOMER, "source": ContactSource.FORM       },
    { "name": "Noah Bergström",     "email": "noah.b@nordicco.se",             "phone": "+14155551016", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    { "name": "Yuki Tanaka",        "email": "yuki.tanaka@creative.jp",        "phone": "+14155551017", "type": ContactType.CUSTOMER, "source": ContactSource.MANUAL     },
    { "name": "Fatima Al-Faris",    "email": "fatima.alfaris@email.com",       "phone": "+14155551018", "type": ContactType.CUSTOMER, "source": ContactSource.BOOKING    },
    # Providers
    { "name": "Alpine Catering Co.",  "email": "hello@alpinecatering.com", "phone": "+14155552001", "type": ContactType.PROVIDER, "source": ContactSource.MANUAL },
    { "name": "Bloom Florals",        "email": "orders@bloomflorals.com",  "phone": "+14155552002", "type": ContactType.PROVIDER, "source": ContactSource.MANUAL },
    # Vendors
    { "name": "TechSounds AV",        "email": "bookings@techsoundsav.com","phone": "+14155553001", "type": ContactType.VENDOR,   "source": ContactSource.MANUAL },
    { "name": "Swift Linen Rentals",   "email": "info@swiftlinen.com",      "phone": "+14155553002", "type": ContactType.VENDOR,   "source": ContactSource.MANUAL },
]

INVENTORY_DATA = [
    { "name": "Executive Suite",         "sku": "RM-EXC-001", "quantity": 4,  "unit": "rooms",  "threshold": 2.0  },
    { "name": "Conference Room A",       "sku": "RM-CNF-001", "quantity": 2,  "unit": "rooms",  "threshold": 1.0  },
    { "name": "Catering – Premium Pkg",  "sku": "CAT-PRE-01", "quantity": 3,  "unit": "pkgs",   "threshold": 5.0  },  # low stock
    { "name": "AV Equipment Set",        "sku": "EQ-AV-001",  "quantity": 6,  "unit": "sets",   "threshold": 2.0  },
    { "name": "Photography Add-on",      "sku": "SVC-PHO-01", "quantity": 8,  "unit": "slots",  "threshold": 3.0  },
    { "name": "Floral Arrangement",      "sku": "DEC-FLR-001","quantity": 12, "unit": "units",  "threshold": 4.0  },
    { "name": "Valet Parking",           "sku": "SVC-VLT-01", "quantity": 20, "unit": "spots",  "threshold": 5.0  },
    { "name": "Outdoor Marquee",         "sku": "EQ-MRQ-001", "quantity": 1,  "unit": "units",  "threshold": 1.0  },
]

FORMS_DATA = [
    { "title": "Event Inquiry Form",      "description": "Capture initial event inquiries from prospective clients.", "purpose": FormPurpose.INQUIRY,      "status": FormStatus.ACTIVE },
    { "title": "Booking Request Form",    "description": "Official booking request with date, package, and guest details.", "purpose": FormPurpose.BOOKING,      "status": FormStatus.ACTIVE },
    { "title": "Post-Event Feedback",     "description": "Collect client feedback after an event has been completed.", "purpose": FormPurpose.CUSTOM,       "status": FormStatus.ACTIVE },
    { "title": "Corporate Client Intake", "description": "Onboarding form for new corporate account clients.", "purpose": FormPurpose.LEAD_CAPTURE,  "status": FormStatus.ACTIVE },
]

ALERTS_DATA = [
    {
        "title": "Low Stock: Catering – Premium Pkg",
        "message": "Stock level (3 pkgs) is below the threshold of 5. Consider restocking before upcoming events.",
        "severity": AlertSeverity.WARNING,
        "is_read": False,
    },
    {
        "title": "Low Stock: Conference Room A",
        "message": "Only 2 rooms available against a threshold of 1. Confirmed bookings may conflict if additional requests come in.",
        "severity": AlertSeverity.WARNING,
        "is_read": False,
    },
    {
        "title": "Booking Confirmed: Brand Retreat — Leila Hassan",
        "message": "Booking #5 has been confirmed. Event scheduled 5 days from now. Ensure catering and AV are coordinated.",
        "severity": AlertSeverity.INFO,
        "is_read": True,
    },
    {
        "title": "New Form Submission: Event Inquiry Form",
        "message": "A new inquiry was submitted via the Event Inquiry Form. Contact has been created and conversation thread opened.",
        "severity": AlertSeverity.INFO,
        "is_read": True,
    },
    {
        "title": "Booking Cancelled: Daniel Osei — Birthday Dinner",
        "message": "Client cancelled booking for Birthday Dinner. The slot has been freed. Follow up may be needed for rescheduling.",
        "severity": AlertSeverity.INFO,
        "is_read": True,
    },
]

AUTOMATION_LOGS_DATA = [
    # Older events (completed successfully)
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 45 },
    { "event_type": "form_submitted",     "status": "success",  "days_ago": 43 },
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 30 },
    { "event_type": "form_submitted",     "status": "success",  "days_ago": 28 },
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 21 },
    { "event_type": "form_approved",      "status": "success",  "days_ago": 20 },
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 14 },
    { "event_type": "form_submitted",     "status": "success",  "days_ago": 12 },
    { "event_type": "booking_cancelled",  "status": "success",  "days_ago": 7  },
    # Recent events
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 5  },
    { "event_type": "form_submitted",     "status": "success",  "days_ago": 4  },
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 3  },
    { "event_type": "form_submitted",     "status": "success",  "days_ago": 2  },
    { "event_type": "booking_confirmed",  "status": "success",  "days_ago": 1  },
    { "event_type": "staff_replied",      "status": "success",  "days_ago": 1  },
    { "event_type": "form_submitted",     "status": "failed",   "days_ago": 0  },  # 1 recent failure for realism
]

# Bookings reference the first 12 customers by index
BOOKINGS_DATA = [
    # completed
    { "ci": 0,  "title": "Corporate Gala — Fontaine Group",    "desc": "Annual Q4 gala, Executive Suite, 80 guests.",             "status": BookingStatus.COMPLETED,  "start_offset": -45 },
    { "ci": 1,  "title": "Product Launch — Webb Industries",    "desc": "Tech product launch, Conference Room A + AV set.",        "status": BookingStatus.COMPLETED,  "start_offset": -30 },
    { "ci": 2,  "title": "Wedding Reception — Priya & Arjun",  "desc": "Outdoor marquee, floral, catering, photography.",         "status": BookingStatus.COMPLETED,  "start_offset": -21 },
    { "ci": 3,  "title": "Birthday Celebration — Cole Family",  "desc": "Private lounge, 40 guests, catering package.",            "status": BookingStatus.COMPLETED,  "start_offset": -14 },
    # confirmed
    { "ci": 4,  "title": "Brand Retreat — Leila Hassan",       "desc": "Two-day leadership offsite, all rooms.",                  "status": BookingStatus.CONFIRMED,  "start_offset": 5  },
    { "ci": 5,  "title": "Anniversary Dinner — Morales",        "desc": "Private executive suite dining, 20 guests.",              "status": BookingStatus.CONFIRMED,  "start_offset": 8  },
    { "ci": 6,  "title": "Engagement Party — Turner",           "desc": "Outdoor marquee, florals, photography add-on.",           "status": BookingStatus.CONFIRMED,  "start_offset": 12 },
    { "ci": 7,  "title": "Startup Pitch Evening — Nakamura",    "desc": "AV setup, conference room, 30 attendees.",                "status": BookingStatus.CONFIRMED,  "start_offset": 15 },
    # pending
    { "ci": 8,  "title": "Charity Fundraiser — Johnson",        "desc": "Ballroom + catering quote requested.",                    "status": BookingStatus.PENDING,    "start_offset": 20 },
    { "ci": 9,  "title": "Corporate Dinner — Remy Dumont",      "desc": "Confirmation awaiting catering menu selection.",          "status": BookingStatus.PENDING,    "start_offset": 22 },
    { "ci": 10, "title": "Team Offsite — Fitzgerald Corp",      "desc": "Multi-room booking request in review.",                   "status": BookingStatus.PENDING,    "start_offset": 25 },
    # cancelled
    { "ci": 11, "title": "Birthday Dinner — Daniel Osei",       "desc": "Cancelled by client — rescheduling for next quarter.",   "status": BookingStatus.CANCELLED,  "start_offset": -7 },
]

# Inbox conversations: (contact index, subject, messages list of (sender_type, content))
CONVERSATIONS_DATA = [
    {
        "ci": 0, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "Corporate Gala — Final Invoice",
        "messages": [
            (SenderType.CONTACT,  "Hi Alex, could you send over the final invoice for the Fontaine gala? We'd like to process payment this week."),
            (SenderType.BUSINESS, "Hi Isabelle! Of course — I'll have that invoice over to your finance team by end of day today. Thanks again for a wonderful event!"),
            (SenderType.CONTACT,  "Perfect, thank you so much. We'll get it processed right away."),
        ],
    },
    {
        "ci": 1, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "AV Setup for Product Launch",
        "messages": [
            (SenderType.CONTACT,  "Hi, we'll need the full AV set including wireless mics and a projector for the launch. Is that included in the package?"),
            (SenderType.BUSINESS, "Yes Marcus, the AV Equipment Set includes wireless mics, 4K projector, and our tech support team on-site for the full duration. You're all set!"),
        ],
    },
    {
        "ci": 4, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Brand Retreat — Room Configuration",
        "messages": [
            (SenderType.CONTACT,  "Hello! For our leadership retreat, can we configure the Executive Suite to have breakout areas? We have 8 people."),
            (SenderType.BUSINESS, "Absolutely Leila! We can set up two breakout corners with comfortable seating in the Executive Suite. I'll send over a layout diagram."),
            (SenderType.CONTACT,  "That sounds perfect. Also, can we get a whiteboard in each breakout area?"),
        ],
    },
    {
        "ci": 5, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Morales Anniversary — Catering Menu",
        "messages": [
            (SenderType.CONTACT,  "Hi Alex, we'd like to go with the 3-course premium menu. Can you confirm the seafood option is still available for our event date?"),
            (SenderType.BUSINESS, "Hi Ethan! The seafood option is available. I'll coordinate with Alpine Catering and confirm the full menu by tomorrow morning."),
            (SenderType.CONTACT,  "Great! Could you also check if they can accommodate a nut-free request for two of our guests?"),
        ],
    },
    {
        "ci": 6, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Engagement Party — Photography Timing",
        "messages": [
            (SenderType.CONTACT,  "Hi! We'd love the photographer to arrive 30 minutes before the event starts. Is that possible?"),
            (SenderType.BUSINESS, "Of course Sophie! I'll book the photographer from 4:30pm. They'll capture arrival shots and candid pre-event moments as guests arrive."),
        ],
    },
    {
        "ci": 8, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Charity Fundraiser — Initial Inquiry",
        "messages": [
            (SenderType.CONTACT,  "Hello, we're organizing a charity fundraiser gala for about 120 guests. Could you send us your pricing for the ballroom package with catering?"),
            (SenderType.BUSINESS, "Hi Amara! Thank you for reaching out. I'd love to help make your fundraiser a success. I'll have a tailored quote with ballroom + catering options to you within 24 hours."),
            (SenderType.CONTACT,  "Wonderful, thank you! We're flexible on dates in March, so any available weekend would work."),
        ],
    },
    {
        "ci": 9, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Corporate Dinner — Menu Confirmation",
        "messages": [
            (SenderType.CONTACT,  "Bonjour, we are still deciding between the continental menu and the premium option. Can you hold our booking for another 3 days?"),
            (SenderType.BUSINESS, "Bien sûr, Remy! I've extended your hold until Friday. Take your time — both menus are excellent and the kitchen team is flexible."),
        ],
    },
    {
        "ci": 10, "channel": ConversationChannel.EMAIL, "is_read": False,
        "subject": "Team Offsite — Room Count",
        "messages": [
            (SenderType.CONTACT,  "We're looking at 24 employees for the offsite. Would we need multiple rooms or can the Executive Suite fit the full group for workshops?"),
            (SenderType.BUSINESS, "Hi Nora! For 24 people in an active workshop format, I'd recommend Executive Suite + Conference Room A to give you a main room and breakout space. I'll prepare a proposal."),
            (SenderType.CONTACT,  "That makes sense. Please include AV and catering in the proposal as well."),
        ],
    },
    {
        "ci": 12, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "Corporate Account Application",
        "messages": [
            (SenderType.CONTACT,  "Hi, we manage events for several companies and would like to set up a corporate account. Who should I speak to about volume pricing?"),
            (SenderType.BUSINESS, "Hi Valentina! I'd be happy to discuss a corporate account with preferred rates. Let me put together a dedicated proposal for Global Events. Expect it by end of week!"),
            (SenderType.CONTACT,  "Excellent! Looking forward to it."),
        ],
    },
    {
        "ci": 13, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "Booking Request — Al-Rashid Group",
        "messages": [
            (SenderType.CONTACT,  "Hello, we are interested in booking the venue for a private executive dinner for 12 guests. Can you advise on available dates next month?"),
            (SenderType.BUSINESS, "Hello Ahmed! We have excellent availability throughout next month for private executive dinners in our Executive Suite. I'll send over a calendar with confirmed slots."),
        ],
    },
    {
        "ci": 14, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "Luxe Events Partnership Inquiry",
        "messages": [
            (SenderType.CONTACT,  "Hi Alex, Charlotte Lawson here from Luxe Events. We're looking for a premium venue partner for our high-end client portfolio. Would you be open to a partnership call?"),
            (SenderType.BUSINESS, "Hi Charlotte! Absolutely — we'd love to explore a partnership with Luxe Events. I'll have our partnership terms to you by tomorrow, and we can schedule a call for next week."),
            (SenderType.CONTACT,  "Fantastic! I'll have my PA reach out to schedule a time. Really exciting opportunity."),
        ],
    },
    {
        "ci": 17, "channel": ConversationChannel.EMAIL, "is_read": True,
        "subject": "Wedding Ceremony Inquiry",
        "messages": [
            (SenderType.CONTACT,  "Hi! We're looking for a venue for our wedding ceremony and reception for 60 guests. Do you handle both ceremonies and receptions?"),
            (SenderType.BUSINESS, "Hello Fatima! Congratulations on your upcoming wedding! Yes, we host both ceremonies and receptions. Our outdoor marquee with garden setting is very popular for weddings. I'll send over our wedding package."),
        ],
    },
]


# ── Main seeder ────────────────────────────────────────────────────

def seed_demo_data(db: Session, workspace_id: int, owner_id: int) -> None:
    """
    Seed all demo data in-order (contacts → inventory → bookings → conversations).
    Fully idempotent: checks for existing records before inserting.
    """
    # Skip if already seeded (check contacts as proxy)
    existing = db.query(Contact).filter(
        Contact.workspace_id == workspace_id,
        Contact.is_deleted == False,
    ).count()
    if existing >= len(CONTACTS_DATA):
        return  # Already seeded

    # ── 1. Contacts ────────────────────────────────────────────────
    contacts = []
    for i, c in enumerate(CONTACTS_DATA):
        contact = Contact(
            name=c["name"],
            email=c["email"],
            phone=c["phone"],
            source=c["source"],
            contact_type=c["type"],
            workspace_id=workspace_id,
            notes=None,
        )
        db.add(contact)
        contacts.append(contact)
    db.flush()   # Get IDs without committing

    # ── 2. Inventory ───────────────────────────────────────────────
    for item_data in INVENTORY_DATA:
        item = InventoryItem(
            name=item_data["name"],
            sku=item_data["sku"],
            quantity=item_data["quantity"],
            unit=item_data["unit"],
            low_stock_threshold=item_data["threshold"],
            workspace_id=workspace_id,
        )
        db.add(item)

    # ── 3. Bookings ────────────────────────────────────────────────
    for b in BOOKINGS_DATA:
        contact = contacts[b["ci"]]
        start = _days_ago(-b["start_offset"]) if b["start_offset"] < 0 else _days_from_now(b["start_offset"])
        booking = Booking(
            title=b["title"],
            description=b["desc"],
            start_time=start,
            end_time=start + timedelta(hours=4),
            timezone="America/New_York",
            status=b["status"],
            contact_id=contact.id,
            workspace_id=workspace_id,
            created_by=owner_id,
        )
        db.add(booking)

    # ── 4. Conversations + Messages ────────────────────────────────
    for conv_data in CONVERSATIONS_DATA:
        contact = contacts[conv_data["ci"]]
        conv = Conversation(
            subject=conv_data["subject"],
            channel=conv_data["channel"],
            is_read=conv_data["is_read"],
            last_message_at=_days_ago(1),
            contact_id=contact.id,
            workspace_id=workspace_id,
        )
        db.add(conv)
        db.flush()

        for idx, (sender, content) in enumerate(conv_data["messages"]):
            msg = Message(
                content=content,
                sender_type=sender,
                message_type=MessageType.MANUAL,
                conversation_id=conv.id,
                workspace_id=workspace_id,
                created_by=owner_id if sender == SenderType.BUSINESS else None,
            )
            db.add(msg)

    # ── 5. Forms ───────────────────────────────────────────────────
    for i, f in enumerate(FORMS_DATA):
        form = Form(
            title=f["title"],
            description=f["description"],
            purpose=f["purpose"],
            status=f["status"],
            public_slug=f"rivera-co-{i+1}-{workspace_id}",
            workspace_id=workspace_id,
        )
        db.add(form)

    # ── 6. Alerts ──────────────────────────────────────────────────
    for a in ALERTS_DATA:
        alert = Alert(
            title=a["title"],
            message=a["message"],
            severity=a["severity"],
            is_read=a["is_read"],
            workspace_id=workspace_id,
        )
        db.add(alert)

    # ── 7. Automation Logs ─────────────────────────────────────────
    from sqlalchemy import text as sa_text
    for log_data in AUTOMATION_LOGS_DATA:
        log = AutomationLog(
            workspace_id=workspace_id,
            event_type=log_data["event_type"],
            status=log_data["status"],
            reference_id=None,
        )
        db.add(log)
        db.flush()
        # Backdate the created_at manually to spread logs over time
        days_offset = log_data["days_ago"]
        db.execute(
            sa_text("UPDATE automation_logs SET created_at = :ts WHERE id = :id"),
            {"ts": _days_ago(days_offset), "id": log.id}
        )

    db.commit()

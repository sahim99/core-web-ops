# Import all models so SQLAlchemy's mapper registry can resolve all relationships.
# This file must be imported before any database session is used.
from app.models.base import Base  # noqa: F401
from app.models.workspace import Workspace  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.staff_permission import StaffPermission  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.booking import Booking  # noqa: F401
from app.models.form import Form  # noqa: F401
from app.models.form_field import FormField  # noqa: F401
from app.models.form_answer import FormAnswer  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.event_log import EventLog  # noqa: F401
from app.models.automation_log import AutomationLog  # noqa: F401
from app.models.inventory import InventoryItem  # noqa: F401
from app.models.internal_message import InternalMessage  # noqa: F401

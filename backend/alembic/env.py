"""
Alembic environment configuration.
Reads DATABASE_URL from app settings (environment variables).
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.core.config import settings
from app.models.base import Base

# Import all models so Alembic can detect them
from app.models.workspace import Workspace  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.booking import Booking  # noqa: F401
from app.models.form import Form, FormSubmission  # noqa: F401
from app.models.form_field import FormField  # noqa: F401
from app.models.form_answer import FormAnswer  # noqa: F401
from app.models.inventory import InventoryItem  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.event_log import EventLog  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.staff_permission import StaffPermission  # noqa: F401
from app.models.automation_log import AutomationLog  # noqa: F401

# Alembic Config object
config = context.config

# Escape % characters so configparser doesn't treat them as interpolation markers
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    from sqlalchemy import create_engine

    # Use the raw URL from settings to avoid configparser interpolation issues
    connectable = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

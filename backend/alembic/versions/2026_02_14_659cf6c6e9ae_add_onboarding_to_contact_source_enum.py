"""add onboarding to contact source enum

Revision ID: 659cf6c6e9ae
Revises: 53dc5edd13c9
Create Date: 2026-02-14 12:07:53.191043

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '659cf6c6e9ae'
down_revision: Union[str, None] = '53dc5edd13c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL ENUMs: use ALTER TYPE to add new values.
    # SQLAlchemy uses the Python enum .name (UPPERCASE) for PG native enums.
    op.execute("ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'ONBOARDING'")


def downgrade() -> None:
    # PostgreSQL does not support removing individual enum values.
    pass

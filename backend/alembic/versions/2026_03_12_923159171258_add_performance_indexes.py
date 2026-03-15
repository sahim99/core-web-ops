"""Add performance indexes

Revision ID: 923159171258
Revises: 010c9facad0f
Create Date: 2026-03-12 16:31:49.576522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '923159171258'
down_revision: Union[str, None] = '010c9facad0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_contacts_created_at', 'contacts', ['created_at'])
    op.create_index('ix_bookings_created_at', 'bookings', ['created_at'])
    op.create_index('ix_bookings_start_time', 'bookings', ['start_time'])
    op.create_index('ix_form_submissions_created_at', 'form_submissions', ['created_at'])
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'])
    op.create_index('ix_conversations_created_at', 'conversations', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_conversations_created_at', table_name='conversations')
    op.drop_index('ix_alerts_created_at', table_name='alerts')
    op.drop_index('ix_form_submissions_created_at', table_name='form_submissions')
    op.drop_index('ix_bookings_start_time', table_name='bookings')
    op.drop_index('ix_bookings_created_at', table_name='bookings')
    op.drop_index('ix_contacts_created_at', table_name='contacts')

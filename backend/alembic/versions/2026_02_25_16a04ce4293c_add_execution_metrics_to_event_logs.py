"""add_execution_metrics_to_event_logs

Revision ID: 16a04ce4293c
Revises: 8109c6653705
Create Date: 2026-02-25 22:25:27.545445

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

revision: str = '16a04ce4293c'
down_revision: Union[str, None] = '8109c6653705'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Drop tables/indexes that may or may not exist depending on migration history
    conn.execute(text("DROP TABLE IF EXISTS notification_preferences CASCADE"))
    conn.execute(text("DROP INDEX IF EXISTS ix_internal_messages_global_sender_id"))
    conn.execute(text("DROP INDEX IF EXISTS ix_internal_messages_global_workspace_id"))
    conn.execute(text("DROP TABLE IF EXISTS internal_messages_global CASCADE"))

    # Add execution tracking columns to event_logs
    inspector = sa.inspect(conn)
    event_log_cols = [c['name'] for c in inspector.get_columns('event_logs')]
    if 'execution_ms' not in event_log_cols:
        op.add_column('event_logs', sa.Column('execution_ms', sa.Integer(), nullable=True))
    if 'action_count' not in event_log_cols:
        op.add_column('event_logs', sa.Column('action_count', sa.Integer(), nullable=True))
    if 'failed_action_count' not in event_log_cols:
        op.add_column('event_logs', sa.Column('failed_action_count', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('event_logs', 'failed_action_count')
    op.drop_column('event_logs', 'action_count')
    op.drop_column('event_logs', 'execution_ms')
    op.create_table('internal_messages_global',
        sa.Column('workspace_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('sender_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('content', sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], name='internal_messages_global_sender_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], name='internal_messages_global_workspace_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='internal_messages_global_pkey')
    )
    op.create_index('ix_internal_messages_global_workspace_id', 'internal_messages_global', ['workspace_id'], unique=False)
    op.create_index('ix_internal_messages_global_sender_id', 'internal_messages_global', ['sender_id'], unique=False)
    op.create_table('notification_preferences',
        sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('email_alerts', sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column('in_app_notifications', sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column('marketing_emails', sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='notification_preferences_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', name='notification_preferences_pkey')
    )

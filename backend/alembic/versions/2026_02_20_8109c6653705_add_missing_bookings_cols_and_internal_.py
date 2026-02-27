"""add_missing_bookings_cols_and_internal_messages

Revision ID: 8109c6653705
Revises: add_meta_forms
Create Date: 2026-02-20 03:32:19.055411

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

revision: str = '8109c6653705'
down_revision: Union[str, None] = 'add_meta_forms'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Bookings table: add new columns
    op.add_column('bookings', sa.Column('title', sa.String(length=255), nullable=False, server_default='Booking'))
    op.add_column('bookings', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('bookings', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('timezone', sa.String(length=50), nullable=False, server_default='UTC'))
    op.add_column('bookings', sa.Column('form_submission_id', sa.Integer(), nullable=True))
    op.add_column('bookings', sa.Column('created_by', sa.Integer(), nullable=True))

    # Copy data from old columns to new columns
    conn.execute(text("UPDATE bookings SET title = COALESCE(service_name, 'Booking')"))
    conn.execute(text("UPDATE bookings SET description = notes"))
    conn.execute(text("UPDATE bookings SET start_time = scheduled_at"))

    # Create indexes and foreign keys for new columns
    op.create_index(op.f('ix_bookings_form_submission_id'), 'bookings', ['form_submission_id'], unique=False)
    op.create_index('ix_workspace_booking_start', 'bookings', ['workspace_id', 'start_time'], unique=False)
    op.create_foreign_key('fk_bookings_form_submission', 'bookings', 'form_submissions', ['form_submission_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_bookings_created_by', 'bookings', 'users', ['created_by'], ['id'], ondelete='SET NULL')

    # Drop old indexes and columns
    conn.execute(text("DROP INDEX IF EXISTS ix_bookings_scheduled_at"))
    conn.execute(text("DROP INDEX IF EXISTS ix_workspace_booking_status"))
    conn.execute(text("DROP INDEX IF EXISTS ix_bookings_booking_type_id"))

    # Drop foreign key constraint if it exists
    result = conn.execute(text("""
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name='bookings' AND constraint_name='bookings_booking_type_id_fkey'
    """))
    if result.fetchone():
        op.drop_constraint('bookings_booking_type_id_fkey', 'bookings', type_='foreignkey')

    # Drop old columns if they exist
    inspector = sa.inspect(conn)
    booking_cols = [c['name'] for c in inspector.get_columns('bookings')]
    if 'notes' in booking_cols:
        op.drop_column('bookings', 'notes')
    if 'scheduled_at' in booking_cols:
        op.drop_column('bookings', 'scheduled_at')
    if 'booking_type_id' in booking_cols:
        op.drop_column('bookings', 'booking_type_id')
    if 'service_name' in booking_cols:
        op.drop_column('bookings', 'service_name')

    # Remove server_defaults after data migration
    op.alter_column('bookings', 'title', server_default=None)
    op.alter_column('bookings', 'timezone', server_default=None)

    # 2. Drop old booking_types table if it exists
    conn.execute(text("DROP TABLE IF EXISTS booking_types CASCADE"))

    # 3. Drop notification_preferences if it exists
    conn.execute(text("DROP TABLE IF EXISTS notification_preferences CASCADE"))

    # 4. Drop old internal_messages_global if it exists
    conn.execute(text("DROP TABLE IF EXISTS internal_messages_global CASCADE"))

    # 5. Create internal_messages_global table
    op.create_table('internal_messages_global',
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_internal_messages_global_workspace_id', 'internal_messages_global', ['workspace_id'])
    op.create_index('ix_internal_messages_global_sender_id', 'internal_messages_global', ['sender_id'])

    # 6. Forms unique constraint (only if not already present)
    result = conn.execute(text("""
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name='forms' AND constraint_name='uq_forms_public_slug'
    """))
    if not result.fetchone():
        op.create_unique_constraint('uq_forms_public_slug', 'forms', ['public_slug'])


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("DROP TABLE IF EXISTS internal_messages_global CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS booking_types CASCADE"))
    op.add_column('bookings', sa.Column('service_name', sa.VARCHAR(length=200), nullable=True))
    op.add_column('bookings', sa.Column('booking_type_id', sa.INTEGER(), nullable=True))
    op.add_column('bookings', sa.Column('scheduled_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('notes', sa.TEXT(), nullable=True))
    op.drop_column('bookings', 'created_by')
    op.drop_column('bookings', 'form_submission_id')
    op.drop_column('bookings', 'timezone')
    op.drop_column('bookings', 'end_time')
    op.drop_column('bookings', 'start_time')
    op.drop_column('bookings', 'description')
    op.drop_column('bookings', 'title')

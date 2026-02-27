"""phase1_platform_refactor

Revision ID: 625588d38309
Revises: 659cf6c6e9ae
Create Date: 2026-02-14 16:03:20.166675

Safe migration:
 1. Create new tables
 2. Add new columns NULLABLE
 3. Backfill existing data
 4. Enforce NOT NULL where needed
 5. Add constraints (after dedup)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '625588d38309'
down_revision: Union[str, None] = '659cf6c6e9ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── STEP 1: Create new enum types ────────────────────────────
    contact_type = postgresql.ENUM('CUSTOMER', 'PROVIDER', 'VENDOR', name='contact_type', create_type=False)
    contact_type.create(op.get_bind(), checkfirst=True)

    sender_type = postgresql.ENUM('BUSINESS', 'CONTACT', 'SYSTEM', name='sender_type', create_type=False)
    sender_type.create(op.get_bind(), checkfirst=True)

    message_type = postgresql.ENUM('MANUAL', 'AUTOMATED', 'FORM_SUBMISSION', 'APPROVAL', 'BOOKING', name='message_type', create_type=False)
    message_type.create(op.get_bind(), checkfirst=True)

    form_purpose = postgresql.ENUM('LEAD_CAPTURE', 'INQUIRY', 'ONBOARDING', 'SUPPORT', 'CUSTOM', name='form_purpose', create_type=False)
    form_purpose.create(op.get_bind(), checkfirst=True)

    form_status = postgresql.ENUM('DRAFT', 'ACTIVE', name='form_status', create_type=False)
    form_status.create(op.get_bind(), checkfirst=True)

    submission_status = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='submission_status', create_type=False)
    submission_status.create(op.get_bind(), checkfirst=True)

    field_type = postgresql.ENUM('TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'DATE', name='field_type', create_type=False)
    field_type.create(op.get_bind(), checkfirst=True)

    # ── STEP 2: Create new tables ────────────────────────────────
    op.create_table('automation_logs',
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_autolog_workspace_created', 'automation_logs', ['workspace_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_automation_logs_event_type'), 'automation_logs', ['event_type'], unique=False)
    op.create_index(op.f('ix_automation_logs_id'), 'automation_logs', ['id'], unique=False)
    op.create_index(op.f('ix_automation_logs_workspace_id'), 'automation_logs', ['workspace_id'], unique=False)

    op.create_table('form_fields',
        sa.Column('form_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('field_type', postgresql.ENUM('TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'DATE', name='field_type', create_type=False), nullable=False),
        sa.Column('required', sa.Boolean(), nullable=False),
        sa.Column('field_order', sa.Integer(), nullable=False),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['form_id'], ['forms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_form_fields_form_id'), 'form_fields', ['form_id'], unique=False)
    op.create_index(op.f('ix_form_fields_id'), 'form_fields', ['id'], unique=False)

    op.create_table('form_answers',
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('field_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['field_id'], ['form_fields.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['submission_id'], ['form_submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_form_answers_field_id'), 'form_answers', ['field_id'], unique=False)
    op.create_index(op.f('ix_form_answers_id'), 'form_answers', ['id'], unique=False)
    op.create_index(op.f('ix_form_answers_submission_id'), 'form_answers', ['submission_id'], unique=False)

    # ── STEP 3: Add new columns (all NULLABLE first) ─────────────

    # contacts.contact_type — nullable first, then backfill
    op.add_column('contacts', sa.Column('contact_type',
        sa.Enum('CUSTOMER', 'PROVIDER', 'VENDOR', name='contact_type', create_type=False),
        nullable=True))
    op.create_index('ix_workspace_email', 'contacts', ['workspace_id', 'email'], unique=False)

    # form_submissions.status
    op.add_column('form_submissions', sa.Column('status',
        sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='submission_status', create_type=False),
        nullable=True))
    op.alter_column('form_submissions', 'data',
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        nullable=True)

    # forms: purpose, status, public_slug
    op.add_column('forms', sa.Column('purpose',
        sa.Enum('LEAD_CAPTURE', 'INQUIRY', 'ONBOARDING', 'SUPPORT', 'CUSTOM', name='form_purpose', create_type=False),
        nullable=True))
    op.add_column('forms', sa.Column('status',
        sa.Enum('DRAFT', 'ACTIVE', name='form_status', create_type=False),
        nullable=True))
    op.add_column('forms', sa.Column('public_slug', sa.String(length=255), nullable=True))
    op.alter_column('forms', 'is_active',
        existing_type=sa.BOOLEAN(),
        nullable=True)

    # messages: content, sender_type, message_type, metadata
    op.add_column('messages', sa.Column('content', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('sender_type',
        sa.Enum('BUSINESS', 'CONTACT', 'SYSTEM', name='sender_type', create_type=False),
        nullable=True))
    op.add_column('messages', sa.Column('message_type',
        sa.Enum('MANUAL', 'AUTOMATED', 'FORM_SUBMISSION', 'APPROVAL', 'BOOKING', name='message_type', create_type=False),
        nullable=True))
    op.add_column('messages', sa.Column('metadata', sa.JSON(), nullable=True))
    op.alter_column('messages', 'body',
        existing_type=sa.TEXT(),
        nullable=True)
    op.alter_column('messages', 'direction',
        existing_type=postgresql.ENUM('INBOUND', 'OUTBOUND', 'SYSTEM', name='message_direction'),
        nullable=True)

    # ── STEP 4: Backfill existing data ───────────────────────────

    # Backfill contacts: all existing → customer
    op.execute("UPDATE contacts SET contact_type = 'CUSTOMER'::contact_type WHERE contact_type IS NULL")
    op.alter_column('contacts', 'contact_type', nullable=False)

    # Backfill form_submissions: all existing → pending
    op.execute("UPDATE form_submissions SET status = 'PENDING'::submission_status WHERE status IS NULL")

    # Backfill forms: purpose=CUSTOM, status based on is_active
    op.execute("UPDATE forms SET purpose = 'CUSTOM'::form_purpose WHERE purpose IS NULL")
    op.execute("""
        UPDATE forms SET status = CASE
            WHEN is_active = true THEN 'ACTIVE'::form_status
            ELSE 'DRAFT'::form_status
        END WHERE status IS NULL
    """)
    # Generate public_slug from id + title
    op.execute("""
        UPDATE forms SET public_slug = LOWER(
            REGEXP_REPLACE(
                CONCAT(REPLACE(LEFT(title, 30), ' ', '-'), '-', id),
                '[^a-z0-9-]', '', 'g'
            )
        ) WHERE public_slug IS NULL
    """)

    # Backfill messages: copy body → content, direction → sender_type
    op.execute("UPDATE messages SET content = body WHERE content IS NULL AND body IS NOT NULL")
    op.execute("""
        UPDATE messages SET sender_type = CASE
            WHEN direction = 'INBOUND'::message_direction THEN 'CONTACT'::sender_type
            WHEN direction = 'OUTBOUND'::message_direction THEN 'BUSINESS'::sender_type
            WHEN direction = 'SYSTEM'::message_direction THEN 'SYSTEM'::sender_type
            ELSE 'SYSTEM'::sender_type
        END WHERE sender_type IS NULL
    """)
    op.execute("UPDATE messages SET message_type = 'MANUAL'::message_type WHERE message_type IS NULL")

    # ── STEP 5: Add unique index on public_slug ──────────────────
    op.create_index('ix_form_public_slug', 'forms', ['public_slug'], unique=True)

    # ── STEP 6: Add unique constraint on conversations ───────────
    # First, delete duplicate conversations (keep the one with lowest id)
    op.execute("""
        DELETE FROM conversations
        WHERE id NOT IN (
            SELECT MIN(id) FROM conversations
            GROUP BY workspace_id, contact_id
        )
    """)
    op.create_unique_constraint('uq_workspace_contact', 'conversations', ['workspace_id', 'contact_id'])


def downgrade() -> None:
    # Remove constraints first
    op.drop_constraint('uq_workspace_contact', 'conversations', type_='unique')
    op.drop_index('ix_form_public_slug', table_name='forms')
    op.drop_index('ix_workspace_email', table_name='contacts')

    # Restore messages to old schema
    op.alter_column('messages', 'direction',
        existing_type=postgresql.ENUM('INBOUND', 'OUTBOUND', 'SYSTEM', name='message_direction'),
        nullable=False)
    op.alter_column('messages', 'body',
        existing_type=sa.TEXT(),
        nullable=False)
    op.drop_column('messages', 'metadata')
    op.drop_column('messages', 'message_type')
    op.drop_column('messages', 'sender_type')
    op.drop_column('messages', 'content')

    # Restore forms
    op.alter_column('forms', 'is_active',
        existing_type=sa.BOOLEAN(),
        nullable=False)
    op.drop_column('forms', 'public_slug')
    op.drop_column('forms', 'status')
    op.drop_column('forms', 'purpose')

    # Restore form_submissions
    op.alter_column('form_submissions', 'data',
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        nullable=False)
    op.drop_column('form_submissions', 'status')

    # Restore contacts
    op.drop_column('contacts', 'contact_type')

    # Drop new tables
    op.drop_index(op.f('ix_form_answers_submission_id'), table_name='form_answers')
    op.drop_index(op.f('ix_form_answers_id'), table_name='form_answers')
    op.drop_index(op.f('ix_form_answers_field_id'), table_name='form_answers')
    op.drop_table('form_answers')

    op.drop_index(op.f('ix_form_fields_id'), table_name='form_fields')
    op.drop_index(op.f('ix_form_fields_form_id'), table_name='form_fields')
    op.drop_table('form_fields')

    op.drop_index(op.f('ix_automation_logs_workspace_id'), table_name='automation_logs')
    op.drop_index(op.f('ix_automation_logs_id'), table_name='automation_logs')
    op.drop_index(op.f('ix_automation_logs_event_type'), table_name='automation_logs')
    op.drop_index('ix_autolog_workspace_created', table_name='automation_logs')
    op.drop_table('automation_logs')

    # Drop new enum types
    sa.Enum(name='field_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='submission_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='form_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='form_purpose').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='message_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='sender_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='contact_type').drop(op.get_bind(), checkfirst=True)

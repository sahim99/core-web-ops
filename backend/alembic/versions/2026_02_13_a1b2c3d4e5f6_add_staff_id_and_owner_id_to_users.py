"""add_staff_id_and_owner_id_to_users

Revision ID: a1b2c3d4e5f6
Revises: f666e4fc8f3e
Create Date: 2026-02-13 17:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f666e4fc8f3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add staff_id column (nullable, unique, indexed)
    op.add_column('users', sa.Column('staff_id', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_users_staff_id'), 'users', ['staff_id'], unique=True)

    # Add owner_id column (nullable FK to users.id, indexed)
    op.add_column('users', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_users_owner_id'), 'users', ['owner_id'], unique=False)
    op.create_foreign_key('fk_users_owner_id', 'users', 'users', ['owner_id'], ['id'], ondelete='CASCADE')

    # Backfill existing staff rows with generated staff_id and owner_id
    # Find the owner for each workspace, then assign to staff in that workspace
    conn = op.get_bind()

    # Get all workspaces and their owners
    owners = conn.execute(
        sa.text("""
            SELECT id, workspace_id FROM users 
            WHERE role = 'OWNER' AND is_deleted = false
        """)
    ).fetchall()

    owner_by_workspace = {row[1]: row[0] for row in owners}

    # Get all existing staff without a staff_id
    staff_rows = conn.execute(
        sa.text("""
            SELECT id, full_name, workspace_id FROM users 
            WHERE role = 'STAFF' AND is_deleted = false AND staff_id IS NULL
        """)
    ).fetchall()

    import re, secrets, string

    used_ids = set()
    for staff_row in staff_rows:
        staff_db_id = staff_row[0]
        full_name = staff_row[1]
        workspace_id = staff_row[2]
        owner_user_id = owner_by_workspace.get(workspace_id)

        # Generate unique staff_id
        first_name = full_name.split()[0] if full_name.strip() else "staff"
        base = re.sub(r"[^a-z]", "", first_name.lower())
        if not base:
            base = "staff"

        for _ in range(100):
            digits = "".join(secrets.choice(string.digits) for _ in range(5))
            letter = secrets.choice(string.ascii_lowercase)
            candidate = f"{base}{digits}{letter}"
            if candidate not in used_ids:
                used_ids.add(candidate)
                break

        conn.execute(
            sa.text("UPDATE users SET staff_id = :sid, owner_id = :oid WHERE id = :uid"),
            {"sid": candidate, "oid": owner_user_id, "uid": staff_db_id}
        )


def downgrade() -> None:
    op.drop_constraint('fk_users_owner_id', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_owner_id'), table_name='users')
    op.drop_column('users', 'owner_id')
    op.drop_index(op.f('ix_users_staff_id'), table_name='users')
    op.drop_column('users', 'staff_id')

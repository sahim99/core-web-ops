"""add meta column to forms

Revision ID: add_meta_forms
Revises: 625588d38309
Create Date: 2026-02-16 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_meta_forms'
down_revision: Union[str, None] = '625588d38309'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add meta column to forms table (JSON, nullable by default, defaults to empty dict)
    op.add_column('forms', sa.Column('meta', sa.JSON(), nullable=True, server_default='{}'))


def downgrade() -> None:
    op.drop_column('forms', 'meta')

"""merge branched heads

Revision ID: 53dc5edd13c9
Revises: 766a18eac498, a1b2c3d4e5f6
Create Date: 2026-02-14 12:06:54.500599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53dc5edd13c9'
down_revision: Union[str, None] = ('766a18eac498', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

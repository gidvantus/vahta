"""finish work request and company decision

Revision ID: 0020
Revises: 0019
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vacancy_application",
        sa.Column("finish_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "vacancy_application",
        sa.Column("finish_reject_kind", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "vacancy_application",
        sa.Column("finish_reject_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vacancy_application", "finish_reject_reason")
    op.drop_column("vacancy_application", "finish_reject_kind")
    op.drop_column("vacancy_application", "finish_confirmed")

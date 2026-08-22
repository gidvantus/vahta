"""jobseeker avatar photo

Revision ID: 0021
Revises: 0020
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobseeker",
        sa.Column("photo", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("jobseeker", "photo")

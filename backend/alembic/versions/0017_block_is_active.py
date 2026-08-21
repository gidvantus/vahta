"""company_jobseeker_block.is_active — разблокировка без потери причины

Revision ID: 0017
Revises: 0016
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "company_jobseeker_block",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.create_index(
        op.f("ix_company_jobseeker_block_is_active"),
        "company_jobseeker_block",
        ["is_active"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_company_jobseeker_block_is_active"),
        table_name="company_jobseeker_block",
    )
    op.drop_column("company_jobseeker_block", "is_active")

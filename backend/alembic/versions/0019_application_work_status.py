"""work progress on vacancy_application

Revision ID: 0019
Revises: 0018
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vacancy_application",
        sa.Column("work_status", sa.String(length=16), nullable=False, server_default="none"),
    )
    op.create_index(
        op.f("ix_vacancy_application_work_status"),
        "vacancy_application",
        ["work_status"],
    )
    op.add_column(
        "vacancy_application",
        sa.Column("arrival_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "vacancy_application",
        sa.Column("start_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("vacancy_application", "start_confirmed")
    op.drop_column("vacancy_application", "arrival_confirmed")
    op.drop_index(
        op.f("ix_vacancy_application_work_status"),
        table_name="vacancy_application",
    )
    op.drop_column("vacancy_application", "work_status")

"""vacancy_application — отклики вахтовиков на вакансии

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vacancy_application",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vacancy_id", sa.Integer(), nullable=False),
        sa.Column("jobseeker_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["vacancy_id"], ["vacancy.id"]),
        sa.ForeignKeyConstraint(["jobseeker_id"], ["jobseeker.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "vacancy_id",
            "jobseeker_id",
            name="uq_application_vacancy_jobseeker",
        ),
    )
    op.create_index(
        op.f("ix_vacancy_application_vacancy_id"),
        "vacancy_application",
        ["vacancy_id"],
    )
    op.create_index(
        op.f("ix_vacancy_application_jobseeker_id"),
        "vacancy_application",
        ["jobseeker_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_vacancy_application_jobseeker_id"), table_name="vacancy_application")
    op.drop_index(op.f("ix_vacancy_application_vacancy_id"), table_name="vacancy_application")
    op.drop_table("vacancy_application")

"""vacancy_favorite — избранные вакансии вахтовика

Revision ID: 0018
Revises: 0017
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vacancy_favorite",
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
            name="uq_favorite_vacancy_jobseeker",
        ),
    )
    op.create_index(
        op.f("ix_vacancy_favorite_vacancy_id"),
        "vacancy_favorite",
        ["vacancy_id"],
    )
    op.create_index(
        op.f("ix_vacancy_favorite_jobseeker_id"),
        "vacancy_favorite",
        ["jobseeker_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_vacancy_favorite_jobseeker_id"), table_name="vacancy_favorite")
    op.drop_index(op.f("ix_vacancy_favorite_vacancy_id"), table_name="vacancy_favorite")
    op.drop_table("vacancy_favorite")

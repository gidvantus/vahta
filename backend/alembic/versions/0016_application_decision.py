"""application status + company_jobseeker_block

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vacancy_application",
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
    )
    op.create_index(
        op.f("ix_vacancy_application_status"),
        "vacancy_application",
        ["status"],
    )
    op.add_column(
        "vacancy_application",
        sa.Column("decision_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "vacancy_application",
        sa.Column("decided_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "company_jobseeker_block",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("legal_company_id", sa.Integer(), nullable=False),
        sa.Column("jobseeker_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["legal_company_id"], ["legal_company.id"]),
        sa.ForeignKeyConstraint(["jobseeker_id"], ["jobseeker.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "legal_company_id",
            "jobseeker_id",
            name="uq_company_jobseeker_block",
        ),
    )
    op.create_index(
        op.f("ix_company_jobseeker_block_legal_company_id"),
        "company_jobseeker_block",
        ["legal_company_id"],
    )
    op.create_index(
        op.f("ix_company_jobseeker_block_jobseeker_id"),
        "company_jobseeker_block",
        ["jobseeker_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_company_jobseeker_block_jobseeker_id"),
        table_name="company_jobseeker_block",
    )
    op.drop_index(
        op.f("ix_company_jobseeker_block_legal_company_id"),
        table_name="company_jobseeker_block",
    )
    op.drop_table("company_jobseeker_block")
    op.drop_column("vacancy_application", "decided_at")
    op.drop_column("vacancy_application", "decision_reason")
    op.drop_index(op.f("ix_vacancy_application_status"), table_name="vacancy_application")
    op.drop_column("vacancy_application", "status")

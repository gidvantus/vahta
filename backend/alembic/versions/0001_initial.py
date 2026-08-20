"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-15

"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- company ---
    op.create_table(
        "company",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("logo", sa.String(length=500), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_company_name"), "company", ["name"], unique=True)
    op.create_index(op.f("ix_company_slug"), "company", ["slug"], unique=True)

    # --- city ---
    op.create_table(
        "city",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_city_name"), "city", ["name"], unique=True)

    # --- vacancy ---
    op.create_table(
        "vacancy",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("salary_from", sa.Integer(), nullable=True),
        sa.Column("salary_to", sa.Integer(), nullable=True),
        sa.Column("schedule", sa.String(length=32), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("city_id", sa.Integer(), nullable=True),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["city_id"], ["city.id"]),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vacancy_city_id"), "vacancy", ["city_id"], unique=False)
    op.create_index(op.f("ix_vacancy_company_id"), "vacancy", ["company_id"], unique=False)
    op.create_index(op.f("ix_vacancy_is_active"), "vacancy", ["is_active"], unique=False)
    op.create_index(op.f("ix_vacancy_published_at"), "vacancy", ["published_at"], unique=False)
    op.create_index(op.f("ix_vacancy_schedule"), "vacancy", ["schedule"], unique=False)
    op.create_index(op.f("ix_vacancy_title"), "vacancy", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_vacancy_title"), table_name="vacancy")
    op.drop_index(op.f("ix_vacancy_schedule"), table_name="vacancy")
    op.drop_index(op.f("ix_vacancy_published_at"), table_name="vacancy")
    op.drop_index(op.f("ix_vacancy_is_active"), table_name="vacancy")
    op.drop_index(op.f("ix_vacancy_company_id"), table_name="vacancy")
    op.drop_index(op.f("ix_vacancy_city_id"), table_name="vacancy")
    op.drop_table("vacancy")

    op.drop_index(op.f("ix_city_name"), table_name="city")
    op.drop_table("city")

    op.drop_index(op.f("ix_company_slug"), table_name="company")
    op.drop_index(op.f("ix_company_name"), table_name="company")
    op.drop_table("company")

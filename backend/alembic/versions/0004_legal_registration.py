"""legal registration: legal_registrant + legal_company

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-20

Отдельный модуль регистрации юридического лица (не связан с каталогом
вакансий). Две таблицы: персональные данные регистратора
(legal_registrant, уникальный телефон) и данные организации
(legal_company, уникальный ИНН).
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- legal_registrant: персональные данные регистратора ---
    op.create_table(
        "legal_registrant",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column("consent", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_legal_registrant_phone"), "legal_registrant", ["phone"], unique=True
    )

    # --- legal_company: данные организации ---
    op.create_table(
        "legal_company",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("inn", sa.String(length=10), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("registrant_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["registrant_id"], ["legal_registrant.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_legal_company_inn"), "legal_company", ["inn"], unique=True)
    op.create_index(
        op.f("ix_legal_company_registrant_id"),
        "legal_company",
        ["registrant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_legal_company_registrant_id"), table_name="legal_company")
    op.drop_index(op.f("ix_legal_company_inn"), table_name="legal_company")
    op.drop_table("legal_company")

    op.drop_index(op.f("ix_legal_registrant_phone"), table_name="legal_registrant")
    op.drop_table("legal_registrant")

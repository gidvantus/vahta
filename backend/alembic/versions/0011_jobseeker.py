"""jobseeker — регистрация для поиска работы (физическое лицо)

Revision ID: 0011
Revises: 0010
Create Date: 2026-08-21

Отдельный модуль регистрации соискателя: таблица jobseeker с данными
физического лица (ФИО, телефон — уникальный ключ, хеш пароля).
"""

import sqlalchemy as sa
from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jobseeker",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column("password_hash", sa.String(length=256), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_jobseeker_phone"), "jobseeker", ["phone"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_jobseeker_phone"), table_name="jobseeker")
    op.drop_table("jobseeker")

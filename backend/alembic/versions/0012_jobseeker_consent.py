"""jobseeker.consent — согласие на обработку персональных данных

Revision ID: 0012
Revises: 0011
Create Date: 2026-08-21

Как и в legal_registrant: при регистрации физлица обязательно
согласие на обработку персональных данных, значение хранится
в отдельной колонке.
"""

import sqlalchemy as sa
from alembic import op

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobseeker",
        sa.Column("consent", sa.Boolean(), nullable=True),
    )
    # Существующим записям (если есть) — согласие не дано.
    op.execute("UPDATE jobseeker SET consent = false WHERE consent IS NULL")
    op.alter_column("jobseeker", "consent", nullable=False)


def downgrade() -> None:
    op.drop_column("jobseeker", "consent")

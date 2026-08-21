"""vacancy travel paid

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-21

Поле «Оплачиваем проезд» (travel_paid): оплачивает ли работодатель
проезд до места работы (Да/Нет).
"""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vacancy", sa.Column("travel_paid", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "travel_paid")

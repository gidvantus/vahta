"""vacancy shift fields to json lists

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-21

Поля «продолжительность вахты», «график работы» и «количество рабочих
часов» становятся списками (JSON-массивы): в форме можно выбрать
несколько вариантов. Старые значения (одиночные) теряются — для
демо-данных их восстанавливает seed.
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("vacancy", "hours_per_shift")
    op.drop_column("vacancy", "shift_length")
    op.drop_column("vacancy", "work_schedule")
    op.add_column("vacancy", sa.Column("hours_per_shift", sa.JSON(), nullable=True))
    op.add_column("vacancy", sa.Column("shift_length", sa.JSON(), nullable=True))
    op.add_column("vacancy", sa.Column("work_schedule", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "work_schedule")
    op.drop_column("vacancy", "shift_length")
    op.drop_column("vacancy", "hours_per_shift")
    op.add_column("vacancy", sa.Column("hours_per_shift", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("shift_length", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("work_schedule", sa.String(length=32), nullable=True))

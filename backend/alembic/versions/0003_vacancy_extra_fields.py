"""vacancy extra card fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-21

Поля карточки вакансии из формы создания: зарплата в час, часы в смену,
продолжительность вахты, график работы, общежитие (адрес + схема проезда),
фото работы/проживания, акции клиента, обязанности, условия проживания,
питание, медкнижка, опыт работы, спецодежда.
"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vacancy", sa.Column("salary_hourly_from", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("salary_hourly_to", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("hours_per_shift", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("shift_length", sa.Integer(), nullable=True))
    op.add_column("vacancy", sa.Column("work_schedule", sa.String(length=32), nullable=True))
    op.add_column("vacancy", sa.Column("dorm_address", sa.String(length=300), nullable=True))
    op.add_column("vacancy", sa.Column("dorm_route", sa.Text(), nullable=True))
    op.add_column("vacancy", sa.Column("work_photos", sa.JSON(), nullable=True))
    op.add_column("vacancy", sa.Column("dorm_photos", sa.JSON(), nullable=True))
    op.add_column("vacancy", sa.Column("promos", sa.JSON(), nullable=True))
    op.add_column("vacancy", sa.Column("duties", sa.Text(), nullable=True))
    op.add_column("vacancy", sa.Column("living_conditions", sa.Text(), nullable=True))
    op.add_column("vacancy", sa.Column("meals", sa.String(length=16), nullable=True))
    op.add_column("vacancy", sa.Column("med_book", sa.String(length=16), nullable=True))
    op.add_column("vacancy", sa.Column("experience_required", sa.Boolean(), nullable=True))
    op.add_column("vacancy", sa.Column("experience_requirements", sa.Text(), nullable=True))
    op.add_column("vacancy", sa.Column("clothing", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "clothing")
    op.drop_column("vacancy", "experience_requirements")
    op.drop_column("vacancy", "experience_required")
    op.drop_column("vacancy", "med_book")
    op.drop_column("vacancy", "meals")
    op.drop_column("vacancy", "living_conditions")
    op.drop_column("vacancy", "duties")
    op.drop_column("vacancy", "promos")
    op.drop_column("vacancy", "dorm_photos")
    op.drop_column("vacancy", "work_photos")
    op.drop_column("vacancy", "dorm_route")
    op.drop_column("vacancy", "dorm_address")
    op.drop_column("vacancy", "work_schedule")
    op.drop_column("vacancy", "shift_length")
    op.drop_column("vacancy", "hours_per_shift")
    op.drop_column("vacancy", "salary_hourly_to")
    op.drop_column("vacancy", "salary_hourly_from")

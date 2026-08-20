"""schedule reference table, city.is_main, vacancy.schedule_id

Revision ID: 0002
Revises: 0001
Create Date: 2026-01-16

Справочник графиков вахты (schedule), флаг is_main в справочнике
городов (city) и перевод вакансий на schedule_id (FK на справочник)
вместо строкового поля schedule.
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

# Стандартные графики вахты: (value, label, sort_order)
SCHEDULES = [
    ("15/15", "15/15", 1),
    ("30/30", "30/30", 2),
    ("45/15", "45/15", 3),
    ("60/30", "60/30", 4),
    ("90/60", "90/60", 5),
]

# Базовый справочник городов: (name, is_main)
CITIES = [
    ("Москва", True),
    ("Санкт-Петербург", True),
    ("Новосибирск", True),
    ("Красноярск", True),
    ("Новый Уренгой", True),
    ("Талнах", False),
    ("Пермь", False),
    ("Тобольск", False),
    ("Иркутск", False),
]

MAIN_CITY_NAMES = [name for name, is_main in CITIES if is_main]


def upgrade() -> None:
    conn = op.get_bind()

    # --- Справочник графиков вахты ---
    op.create_table(
        "schedule",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("value", sa.String(length=32), nullable=False),
        sa.Column("label", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_schedule_value"), "schedule", ["value"], unique=True)

    for value, label, sort_order in SCHEDULES:
        conn.execute(
            sa.text(
                "INSERT INTO schedule (value, label, sort_order) "
                "VALUES (:v, :l, :s) ON CONFLICT (value) DO NOTHING"
            ),
            {"v": value, "l": label, "s": sort_order},
        )

    # --- Справочник городов: флаг is_main + базовые города ---
    op.add_column(
        "city",
        sa.Column("is_main", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(op.f("ix_city_is_main"), "city", ["is_main"])

    for name, is_main in CITIES:
        conn.execute(
            sa.text(
                "INSERT INTO city (name, is_main) VALUES (:n, :m) "
                "ON CONFLICT (name) DO NOTHING"
            ),
            {"n": name, "m": is_main},
        )
    for name in MAIN_CITY_NAMES:
        conn.execute(
            sa.text("UPDATE city SET is_main = true WHERE name = :n"),
            {"n": name},
        )

    # --- vacancy.schedule_id (FK на справочник) ---
    op.add_column("vacancy", sa.Column("schedule_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_vacancy_schedule_id", "vacancy", "schedule", ["schedule_id"], ["id"]
    )
    op.create_index(op.f("ix_vacancy_schedule_id"), "vacancy", ["schedule_id"])

    # Перенос старых строковых значений (если в БД уже были вакансии):
    # неизвестные графики добавляются в справочник.
    rows = conn.execute(
        sa.text("SELECT DISTINCT schedule FROM vacancy WHERE schedule IS NOT NULL")
    ).fetchall()
    for (value,) in rows:
        sid = conn.execute(
            sa.text("SELECT id FROM schedule WHERE value = :v"), {"v": value}
        ).scalar()
        if sid is None:
            sid = conn.execute(
                sa.text(
                    "INSERT INTO schedule (value, label, sort_order) "
                    "VALUES (:v, :v, 999) RETURNING id"
                ),
                {"v": value},
            ).scalar()
        conn.execute(
            sa.text("UPDATE vacancy SET schedule_id = :sid WHERE schedule = :v"),
            {"sid": sid, "v": value},
        )

    op.drop_column("vacancy", "schedule")


def downgrade() -> None:
    conn = op.get_bind()

    # Восстанавливаем строковое поле и переносим значения из справочника.
    op.add_column("vacancy", sa.Column("schedule", sa.String(length=32), nullable=True))
    rows = conn.execute(
        sa.text(
            "SELECT v.id, s.value FROM vacancy v "
            "LEFT JOIN schedule s ON s.id = v.schedule_id"
        )
    ).fetchall()
    for vid, value in rows:
        conn.execute(
            sa.text("UPDATE vacancy SET schedule = :v WHERE id = :id"),
            {"v": value, "id": vid},
        )

    op.drop_index(op.f("ix_vacancy_schedule_id"), table_name="vacancy")
    op.drop_constraint("fk_vacancy_schedule_id", "vacancy", type_="foreignkey")
    op.drop_column("vacancy", "schedule_id")

    op.drop_index(op.f("ix_city_is_main"), table_name="city")
    op.drop_column("city", "is_main")

    op.drop_index(op.f("ix_schedule_value"), table_name="schedule")
    op.drop_table("schedule")

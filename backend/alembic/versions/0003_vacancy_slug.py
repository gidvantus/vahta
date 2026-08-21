"""vacancy.slug — транслит названия для уникальных адресов карточек

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-20

Добавляет колонку slug в vacancy (транслитерация названия), заполняет
её для существующих вакансий (с дедупликацией -2, -3, …) и ставит
уникальный индекс. Адрес детальной карточки: /vacancy/<slug>.
"""

import sqlalchemy as sa
from alembic import op

from app.translit import translit_slug

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vacancy",
        sa.Column("slug", sa.String(length=200), nullable=True),
    )

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, title FROM vacancy ORDER BY id")).fetchall()
    taken: set[str] = set()
    for vacancy_id, title in rows:
        base = translit_slug(title) or f"vacancy-{vacancy_id}"
        slug = base
        n = 2
        while slug in taken:
            slug = f"{base}-{n}"
            n += 1
        taken.add(slug)
        conn.execute(
            sa.text("UPDATE vacancy SET slug = :s WHERE id = :id"),
            {"s": slug, "id": vacancy_id},
        )

    op.alter_column("vacancy", "slug", nullable=False)
    op.create_index(op.f("ix_vacancy_slug"), "vacancy", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_vacancy_slug"), table_name="vacancy")
    op.drop_column("vacancy", "slug")

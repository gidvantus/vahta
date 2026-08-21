"""vacancy.full_slug — транслит названия + транслит организации

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-21

Полный слаг карточки: «mashinist-burovoj-ustanovki-gazprom-neft»
(транслит названия вакансии + '-' + транслит организации). Карточка
теперь открывается по нему: /vacancy/<full_slug> — вместо id.
Уникальность адреса обеспечивает full_slug, поэтому уникальный индекс
старого slug (только транслит названия) снимается: одна и та же
должность может быть у разных организаций.
"""

import sqlalchemy as sa
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # slug больше не уникален — уникален полный слаг (название + организация).
    op.drop_index(op.f("ix_vacancy_slug"), table_name="vacancy")
    op.create_index(op.f("ix_vacancy_slug"), "vacancy", ["slug"], unique=False)

    op.add_column("vacancy", sa.Column("full_slug", sa.String(length=500), nullable=True))

    # Заполняем full_slug для существующих вакансий: транслит названия +
    # '-' + транслит организации (без организации — просто транслит названия).
    # При коллизии (например «gazprom-neft-x» и «gazprom-neft» + «x»)
    # добавляется суффикс -2, -3, …
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            """
            SELECT v.id, v.slug, c.slug AS company_slug
            FROM vacancy v
            LEFT JOIN company c ON c.id = v.company_id
            ORDER BY v.id
            """
        )
    ).fetchall()
    taken: set[str] = set()
    for vacancy_id, slug, company_slug in rows:
        base = f"{slug}-{company_slug}" if company_slug else slug
        full = base
        n = 2
        while full in taken:
            full = f"{base}-{n}"
            n += 1
        taken.add(full)
        conn.execute(
            sa.text("UPDATE vacancy SET full_slug = :s WHERE id = :id"),
            {"s": full, "id": vacancy_id},
        )

    op.alter_column("vacancy", "full_slug", nullable=False)
    op.create_index(op.f("ix_vacancy_full_slug"), "vacancy", ["full_slug"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_vacancy_full_slug"), table_name="vacancy")
    op.drop_column("vacancy", "full_slug")
    op.drop_index(op.f("ix_vacancy_slug"), table_name="vacancy")
    op.create_index(op.f("ix_vacancy_slug"), "vacancy", ["slug"], unique=True)

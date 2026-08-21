"""vacancy status and legal company owner

Revision ID: 0011
Revises: 0010
Create Date: 2026-08-21

Статус вакансии (status): draft (не опубликована/черновик) | published
(опубликована, видна в каталоге) | archived (архив). Новые вакансии
создаются как draft. Привязка вакансии к организации из личного
кабинета (legal_company_id) — для страницы «Список вакансий».
"""

import sqlalchemy as sa
from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Существующие записи считаем опубликованными; новые создаются
    # как draft (значение по умолчанию задаётся в модели).
    op.add_column(
        "vacancy",
        sa.Column("status", sa.String(length=16), nullable=False, server_default="published"),
    )
    op.create_index(op.f("ix_vacancy_status"), "vacancy", ["status"])

    op.add_column("vacancy", sa.Column("legal_company_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_vacancy_legal_company_id"), "vacancy", ["legal_company_id"])
    op.create_foreign_key(
        "fk_vacancy_legal_company_id",
        "vacancy",
        "legal_company",
        ["legal_company_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_vacancy_legal_company_id", "vacancy", type_="foreignkey")
    op.drop_index(op.f("ix_vacancy_legal_company_id"), table_name="vacancy")
    op.drop_column("vacancy", "legal_company_id")
    op.drop_index(op.f("ix_vacancy_status"), table_name="vacancy")
    op.drop_column("vacancy", "status")

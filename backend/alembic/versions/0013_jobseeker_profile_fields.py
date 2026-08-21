"""jobseeker: поля профиля (личный кабинет физического лица)

Revision ID: 0013
Revises: 0012
Create Date: 2026-08-22

Добавляет в таблицу jobseeker поля, которые заполняются и
редактируются в личном кабинете: дата рождения, возраст, пол,
серия и номер паспорта, гражданство, медицинская книжка.
Колонки nullable — существующие записи не теряют данные;
обязательность проверяется при редактировании (API/UI).
"""

import sqlalchemy as sa
from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobseeker", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("jobseeker", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("jobseeker", sa.Column("gender", sa.String(length=16), nullable=True))
    op.add_column("jobseeker", sa.Column("passport", sa.String(length=30), nullable=True))
    op.add_column(
        "jobseeker", sa.Column("citizenship", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "jobseeker", sa.Column("medical_book", sa.String(length=16), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("jobseeker", "medical_book")
    op.drop_column("jobseeker", "citizenship")
    op.drop_column("jobseeker", "passport")
    op.drop_column("jobseeker", "gender")
    op.drop_column("jobseeker", "age")
    op.drop_column("jobseeker", "date_of_birth")

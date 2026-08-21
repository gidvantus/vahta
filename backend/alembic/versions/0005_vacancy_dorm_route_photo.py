"""vacancy dorm route photo

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-21

Поле «файл схемы проезда» (dorm_route_photo): прикреплённое изображение
схемы проезда к общежитию, дополняет текстовое описание dorm_route.
"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vacancy", sa.Column("dorm_route_photo", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "dorm_route_photo")

"""vacancy dorm route photo

Revision ID: 0008
Revises: 0004
Create Date: 2026-08-21

РџРѕР»Рµ В«С„Р°Р№Р» СЃС…РµРјС‹ РїСЂРѕРµР·РґР°В» (dorm_route_photo): РїСЂРёРєСЂРµРїР»С‘РЅРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ
СЃС…РµРјС‹ РїСЂРѕРµР·РґР° Рє РѕР±С‰РµР¶РёС‚РёСЋ, РґРѕРїРѕР»РЅСЏРµС‚ С‚РµРєСЃС‚РѕРІРѕРµ РѕРїРёСЃР°РЅРёРµ dorm_route.
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vacancy", sa.Column("dorm_route_photo", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "dorm_route_photo")

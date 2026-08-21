"""vacancy travel paid

Revision ID: 0009
Revises: 0005
Create Date: 2026-08-21

РџРѕР»Рµ В«РћРїР»Р°С‡РёРІР°РµРј РїСЂРѕРµР·РґВ» (travel_paid): РѕРїР»Р°С‡РёРІР°РµС‚ Р»Рё СЂР°Р±РѕС‚РѕРґР°С‚РµР»СЊ
РїСЂРѕРµР·Рґ РґРѕ РјРµСЃС‚Р° СЂР°Р±РѕС‚С‹ (Р”Р°/РќРµС‚).
"""

import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vacancy", sa.Column("travel_paid", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("vacancy", "travel_paid")

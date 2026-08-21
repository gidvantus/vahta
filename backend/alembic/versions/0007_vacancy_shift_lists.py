"""vacancy shift fields to json lists

Revision ID: 0007
Revises: 0003
Create Date: 2026-08-21

РџРѕР»СЏ В«РїСЂРѕРґРѕР»Р¶РёС‚РµР»СЊРЅРѕСЃС‚СЊ РІР°С…С‚С‹В», В«РіСЂР°С„РёРє СЂР°Р±РѕС‚С‹В» Рё В«РєРѕР»РёС‡РµСЃС‚РІРѕ СЂР°Р±РѕС‡РёС…
С‡Р°СЃРѕРІВ» СЃС‚Р°РЅРѕРІСЏС‚СЃСЏ СЃРїРёСЃРєР°РјРё (JSON-РјР°СЃСЃРёРІС‹): РІ С„РѕСЂРјРµ РјРѕР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ
РЅРµСЃРєРѕР»СЊРєРѕ РІР°СЂРёР°РЅС‚РѕРІ. РЎС‚Р°СЂС‹Рµ Р·РЅР°С‡РµРЅРёСЏ (РѕРґРёРЅРѕС‡РЅС‹Рµ) С‚РµСЂСЏСЋС‚СЃСЏ вЂ” РґР»СЏ
РґРµРјРѕ-РґР°РЅРЅС‹С… РёС… РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ seed.
"""

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
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

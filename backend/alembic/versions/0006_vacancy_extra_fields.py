"""vacancy extra card fields

Revision ID: 0006
Revises: 0002
Create Date: 2026-08-21

РџРѕР»СЏ РєР°СЂС‚РѕС‡РєРё РІР°РєР°РЅСЃРёРё РёР· С„РѕСЂРјС‹ СЃРѕР·РґР°РЅРёСЏ: Р·Р°СЂРїР»Р°С‚Р° РІ С‡Р°СЃ, С‡Р°СЃС‹ РІ СЃРјРµРЅСѓ,
РїСЂРѕРґРѕР»Р¶РёС‚РµР»СЊРЅРѕСЃС‚СЊ РІР°С…С‚С‹, РіСЂР°С„РёРє СЂР°Р±РѕС‚С‹, РѕР±С‰РµР¶РёС‚РёРµ (Р°РґСЂРµСЃ + СЃС…РµРјР° РїСЂРѕРµР·РґР°),
С„РѕС‚Рѕ СЂР°Р±РѕС‚С‹/РїСЂРѕР¶РёРІР°РЅРёСЏ, Р°РєС†РёРё РєР»РёРµРЅС‚Р°, РѕР±СЏР·Р°РЅРЅРѕСЃС‚Рё, СѓСЃР»РѕРІРёСЏ РїСЂРѕР¶РёРІР°РЅРёСЏ,
РїРёС‚Р°РЅРёРµ, РјРµРґРєРЅРёР¶РєР°, РѕРїС‹С‚ СЂР°Р±РѕС‚С‹, СЃРїРµС†РѕРґРµР¶РґР°.
"""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
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

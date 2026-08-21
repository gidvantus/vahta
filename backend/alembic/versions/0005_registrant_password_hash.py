"""legal_registrant.password_hash — хеш пароля регистратора

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-21

Пароль в открытом виде не хранится: колонка password_hash содержит
только соль + хеш PBKDF2-HMAC-SHA256 (см. app/security.py).
"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "legal_registrant",
        sa.Column("password_hash", sa.String(length=256), nullable=True),
    )
    # Существующим записям (если есть) — пустой хеш: аккаунт без пароля
    # не сможет войти, но данные не потеряются.
    op.execute("UPDATE legal_registrant SET password_hash = '' WHERE password_hash IS NULL")
    op.alter_column("legal_registrant", "password_hash", nullable=False)


def downgrade() -> None:
    op.drop_column("legal_registrant", "password_hash")

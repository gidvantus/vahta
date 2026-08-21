"""Безопасное хеширование паролей (без внешних зависимостей).

Пароли никогда не хранятся и не передаются в открытом виде: в базе
хранится только хеш с уникальной случайной солью. Алгоритм — PBKDF2-
HMAC-SHA256 (рекомендован OWASP), количество итераций 600 000.

Формат хранения: pbkdf2_sha256$<iterations>$<salt_hex>$<digest_hex>
"""

import hashlib
import hmac
import secrets

_PBKDF2_ITERATIONS = 600_000
_SALT_BYTES = 16
_SCHEME = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Хеширует пароль с новой случайной солью (односторонне)."""
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS
    )
    return f"{_SCHEME}${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Сверяет пароль с сохранённым хешем (сравнение с защитой от тайминга)."""
    try:
        scheme, iterations, salt_hex, digest_hex = stored.split("$")
        if scheme != _SCHEME:
            return False
        iterations = int(iterations)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, AttributeError):
        return False
    actual = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return hmac.compare_digest(actual, expected)

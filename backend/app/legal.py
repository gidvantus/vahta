"""Валидация данных регистрации юридического лица (отдельный модуль).

Не связан с логикой каталога вакансий: телефон (маска
+7 (XXX) XXX-XX-XX), ИНН юрлица (10 цифр + контрольная сумма)
и пароль (не менее 8 символов, латиница в верхнем и нижнем
регистре, цифры).
"""

import re

# Веса контрольной суммы ИНН юрлица (первые 9 разрядов).
INN_WEIGHTS = (2, 4, 10, 3, 5, 9, 4, 6, 8)

_NON_DIGITS = re.compile(r"\D+")


def normalize_phone(phone: str) -> str | None:
    """Приводит телефон к каноническому виду +7XXXXXXXXXX.

    Принимает любые разделители (пробелы, скобки, дефисы) и варианты
    префикса (7, 8 или вообще без префикса). Возвращает None, если
    номер не похож на российский 11-значный.
    """
    digits = _NON_DIGITS.sub("", phone)
    if len(digits) == 11 and digits[0] in ("7", "8"):
        return f"+7{digits[1:]}"
    if len(digits) == 10:
        return f"+7{digits}"
    return None


def is_valid_inn_10(inn: str) -> bool:
    """Проверяет ИНН юрлица: ровно 10 цифр и контрольная сумма."""
    if len(inn) != 10 or not inn.isdigit():
        return False
    control = sum(int(inn[i]) * INN_WEIGHTS[i] for i in range(9)) % 11 % 10
    return control == int(inn[9])


def is_valid_password(password: str) -> bool:
    """Проверяет пароль: не менее 8 символов, латинские буквы
    верхнего и нижнего регистра и хотя бы одна цифра."""
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True

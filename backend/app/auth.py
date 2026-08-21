"""Авторизация пользователей — отдельный модуль (не связан с каталогом).

Ищет регистратора (legal_registrant) по телефону и сверяет введённый
пароль с хешем из базы (app/security.py). При успехе возвращает данные
личного кабинета — те же, что пользователь указал при регистрации:
регистратор и его организации. Пароль и его хеш в ответ не попадают.
"""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.legal import normalize_phone
from app.models import LegalCompany, LegalRegistrant
from app.schemas import LegalAccountOut, LegalCompanyOut, LegalRegistrantOut
from app.security import verify_password


def authenticate(phone: str, password: str, session: Session) -> LegalAccountOut:
    """Выполняет вход по телефону и паролю.

    Возвращает данные аккаунта при успехе; при ошибке (телефон не
    в формате, пользователь не найден, пароль не совпал) бросает
    HTTPException с понятным сообщением.
    """
    # Телефон приводится к каноническому виду +7XXXXXXXXXX.
    phone = normalize_phone(phone)
    if phone is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Телефон должен быть в формате +7 (XXX) XXX-XX-XX",
        )

    # Поиск по базе зарегистрированных пользователей.
    registrant = session.exec(
        select(LegalRegistrant).where(LegalRegistrant.phone == phone)
    ).first()
    if registrant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь с таким телефоном не зарегистрирован",
        )

    # Сверка пароля с хешем, сохранённым при регистрации.
    if not verify_password(password, registrant.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль",
        )

    companies = session.exec(
        select(LegalCompany)
        .where(LegalCompany.registrant_id == registrant.id)
        .order_by(LegalCompany.id.desc())
    ).all()

    return LegalAccountOut(
        registrant=LegalRegistrantOut(
            id=registrant.id,
            full_name=registrant.full_name,
            phone=registrant.phone,
            consent=registrant.consent,
            created_at=registrant.created_at,
        ),
        companies=[
            LegalCompanyOut(
                id=company.id,
                inn=company.inn,
                name=company.name,
                created_at=company.created_at,
            )
            for company in companies
        ],
    )

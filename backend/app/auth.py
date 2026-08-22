"""Авторизация пользователей — отдельный модуль (не связан с каталогом).

Два типа аккаунтов, у каждого свой личный кабинет:
- legal — регистратор юридического лица (legal_registrant) и его
  организации (legal_company);
- jobseeker — соискатель, физическое лицо («Регистрация для поиска
  работы», таблица jobseeker).

Пользователь ищется по телефону, введённый пароль сверяется с хешем
из базы (app/security.py). При успехе возвращаются данные личного
кабинета — те же, что пользователь указал при регистрации. Пароль
и его хеш в ответ не попадают.
"""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.legal import is_valid_password, normalize_phone
from app.models import JobSeeker, LegalCompany, LegalRegistrant
from app.schemas import (
    AccountOut,
    ChangePasswordIn,
    JobSeekerOut,
    LegalCompanyOut,
    LegalRegistrantOut,
)
from app.security import hash_password, verify_password


def authenticate(
    phone: str,
    password: str,
    session: Session,
    user_type: str = "legal",
) -> AccountOut:
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

    if user_type == "jobseeker":
        return _authenticate_jobseeker(phone, password, session)

    return _authenticate_legal(phone, password, session)


def change_user_password(
    payload: ChangePasswordIn,
    session: Session,
) -> None:
    """Меняет пароль пользователя (jobseeker или legal).

    Пользователь уже авторизован — определяется по типу аккаунта и
    телефону; текущий пароль не требуется, сессия после смены не
    сбрасывается. Новый пароль проходит ту же проверку, что при
    регистрации. В базу попадает только хеш (app/security.py).
    """
    if not is_valid_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Пароль должен содержать не менее 8 символов, латинские буквы "
                "верхнего и нижнего регистра и хотя бы одну цифру"
            ),
        )
    if payload.password != payload.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Пароли не совпадают",
        )

    phone = normalize_phone(payload.phone)
    if phone is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Телефон должен быть в формате +7 (XXX) XXX-XX-XX",
        )

    if payload.user_type == "jobseeker":
        user = session.exec(
            select(JobSeeker).where(JobSeeker.phone == phone)
        ).first()
    else:
        user = session.exec(
            select(LegalRegistrant).where(LegalRegistrant.phone == phone)
        ).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    user.password_hash = hash_password(payload.password)
    session.commit()


def _authenticate_jobseeker(
    phone: str, password: str, session: Session
) -> AccountOut:
    """Вход соискателя (физического лица)."""
    jobseeker = session.exec(
        select(JobSeeker).where(JobSeeker.phone == phone)
    ).first()
    if jobseeker is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь с таким телефоном не зарегистрирован",
        )
    if not verify_password(password, jobseeker.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль",
        )
    return AccountOut(
        user_type="jobseeker",
        jobseeker=JobSeekerOut(
            id=jobseeker.id,
            full_name=jobseeker.full_name,
            phone=jobseeker.phone,
            consent=jobseeker.consent,
            created_at=jobseeker.created_at,
            date_of_birth=jobseeker.date_of_birth,
            age=jobseeker.age,
            gender=jobseeker.gender,
            passport=jobseeker.passport,
            citizenship=jobseeker.citizenship,
            medical_book=jobseeker.medical_book,
            photo=jobseeker.photo,
        ),
    )


def _authenticate_legal(
    phone: str, password: str, session: Session
) -> AccountOut:
    """Вход регистратора юридического лица."""
    registrant = session.exec(
        select(LegalRegistrant).where(LegalRegistrant.phone == phone)
    ).first()
    if registrant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь с таким телефоном не зарегистрирован",
        )
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

    return AccountOut(
        user_type="legal",
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

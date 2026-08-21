"""Регистрация юридического лица — отдельный роутер.

POST /api/v1/legal-registration — создаёт запись регистратора
(legal_registrant) и организации (legal_company). Данные регистратора
и организации хранятся в разных таблицах. Телефон и ИНН — уникальные
ключи: при совпадении с уже зарегистрированными значениями запрос
отклоняется кодом 409, регистрация не производится.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.legal import is_valid_inn_10, is_valid_password, normalize_phone
from app.models import LegalCompany, LegalRegistrant
from app.schemas import (
    AccountOut,
    LegalCompanyOut,
    LegalCompanyUpdateIn,
    LegalRegistrationIn,
    LegalRegistrationOut,
    LegalRegistrantOut,
    LegalRegistrantUpdateIn,
)
from app.security import hash_password

router = APIRouter(prefix="/api/v1/legal-registration", tags=["legal-registration"])


@router.patch(
    "/registrant/{registrant_id}",
    response_model=LegalRegistrantOut,
    summary="Редактирование данных регистратора",
)
def update_registrant(
    registrant_id: int,
    payload: LegalRegistrantUpdateIn,
    session: Session = Depends(get_session),
) -> LegalRegistrantOut:
    """Обновляет ФИО и телефон регистратора (личный кабинет).

    Согласие на обработку персональных данных не редактируется.
    Телефон — уникальный ключ: при совпадении с чужим номером
    изменение отклоняется кодом 409.
    """
    registrant = session.get(LegalRegistrant, registrant_id)
    if registrant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="ФИО обязательно для заполнения")

    phone = normalize_phone(payload.phone)
    if phone is None:
        raise HTTPException(
            status_code=422,
            detail="Телефон должен быть в формате +7 (XXX) XXX-XX-XX",
        )

    # Телефон — уникальный ключ (кроме самой записи).
    if phone != registrant.phone:
        other = session.exec(
            select(LegalRegistrant).where(LegalRegistrant.phone == phone)
        ).first()
        if other is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким телефоном уже зарегистрирован",
            )

    registrant.full_name = full_name
    registrant.phone = phone
    try:
        session.commit()
    except IntegrityError:
        # Защита от гонки: такой телефон успел появиться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    session.refresh(registrant)
    return LegalRegistrantOut(
        id=registrant.id,
        full_name=registrant.full_name,
        phone=registrant.phone,
        consent=registrant.consent,
        created_at=registrant.created_at,
    )


@router.patch(
    "/companies/{company_id}",
    response_model=LegalCompanyOut,
    summary="Редактирование данных организации",
)
def update_company(
    company_id: int,
    payload: LegalCompanyUpdateIn,
    session: Session = Depends(get_session),
) -> LegalCompanyOut:
    """Обновляет название и ИНН организации (личный кабинет).

    ИНН — уникальный ключ: при совпадении с чужим значением
    изменение отклоняется кодом 409.
    """
    company = session.get(LegalCompany, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Организация не найдена",
        )

    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=422,
            detail="Название организации обязательно для заполнения",
        )

    inn = payload.inn.strip()
    if not is_valid_inn_10(inn):
        raise HTTPException(
            status_code=422,
            detail="ИНН должен содержать 10 цифр и проходить проверку контрольной суммы",
        )

    # ИНН — уникальный ключ (кроме самой записи).
    if inn != company.inn:
        other = session.exec(
            select(LegalCompany).where(LegalCompany.inn == inn)
        ).first()
        if other is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Организация с таким ИНН уже зарегистрирована",
            )

    company.name = name
    company.inn = inn
    try:
        session.commit()
    except IntegrityError:
        # Защита от гонки: такой ИНН успел появиться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Организация с таким ИНН уже зарегистрирована",
        )

    session.refresh(company)
    return LegalCompanyOut(
        id=company.id,
        inn=company.inn,
        name=company.name,
        created_at=company.created_at,
    )


@router.get(
    "/latest",
    response_model=AccountOut,
    summary="Последний зарегистрированный аккаунт (для личного кабинета)",
)
def get_latest_account(
    session: Session = Depends(get_session),
) -> AccountOut:
    """Данные последней регистрации: регистратор и его организации.

    Используется страницей личного кабинета до появления авторизации:
    показываем последнюю запись из базы. Пароль и его хеш
    (password_hash) в ответ не попадают.
    """
    registrant = session.exec(
        select(LegalRegistrant).order_by(LegalRegistrant.id.desc())
    ).first()
    if registrant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Зарегистрированных пользователей пока нет",
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


@router.post(
    "",
    response_model=LegalRegistrationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация юридического лица",
)
def register_legal_company(
    payload: LegalRegistrationIn,
    session: Session = Depends(get_session),
) -> LegalRegistrationOut:
    # Все поля обязательны.
    full_name = payload.full_name.strip()
    company_name = payload.company_name.strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="ФИО обязательно для заполнения")
    if not company_name:
        raise HTTPException(status_code=422, detail="Название организации обязательно для заполнения")
    if not payload.consent:
        raise HTTPException(
            status_code=422,
            detail="Необходимо согласие на обработку персональных данных",
        )

    # Телефон: маска +7 (XXX) XXX-XX-XX, хранится в каноническом виде.
    phone = normalize_phone(payload.phone)
    if phone is None:
        raise HTTPException(
            status_code=422,
            detail="Телефон должен быть в формате +7 (XXX) XXX-XX-XX",
        )

    # ИНН юрлица: ровно 10 цифр + контрольная сумма.
    inn = payload.inn.strip()
    if not is_valid_inn_10(inn):
        raise HTTPException(
            status_code=422,
            detail="ИНН должен содержать 10 цифр и проходить проверку контрольной суммы",
        )

    # Пароль: проверка состава и совпадения с подтверждением.
    # В базу попадает только хеш (app/security.py), не сам пароль.
    if not is_valid_password(payload.password):
        raise HTTPException(
            status_code=422,
            detail=(
                "Пароль должен содержать не менее 8 символов, латинские буквы "
                "верхнего и нижнего регистра и хотя бы одну цифру"
            ),
        )
    if payload.password != payload.password_confirm:
        raise HTTPException(status_code=422, detail="Пароли не совпадают")

    # Уникальные ключи: телефон регистратора и ИНН организации.
    # При совпадении регистрация не производится.
    if session.exec(select(LegalRegistrant).where(LegalRegistrant.phone == phone)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )
    if session.exec(select(LegalCompany).where(LegalCompany.inn == inn)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Организация с таким ИНН уже зарегистрирована",
        )

    # Данные регистратора и организации — в отдельных таблицах.
    registrant = LegalRegistrant(
        full_name=full_name,
        phone=phone,
        password_hash=hash_password(payload.password),
        consent=payload.consent,
    )
    session.add(registrant)
    try:
        session.flush()  # получаем id регистратора
    except IntegrityError:
        # Защита от гонки: такой телефон успел зарегистрироваться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    company = LegalCompany(
        inn=inn,
        name=company_name,
        registrant_id=registrant.id,
    )
    session.add(company)
    try:
        session.commit()
    except IntegrityError:
        # Защита от гонки: такой ИНН успел зарегистрироваться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Организация с таким ИНН уже зарегистрирована",
        )

    session.refresh(company)
    return LegalRegistrationOut(
        id=company.id,
        full_name=registrant.full_name,
        phone=registrant.phone,
        inn=company.inn,
        company_name=company.name,
        created_at=company.created_at,
    )

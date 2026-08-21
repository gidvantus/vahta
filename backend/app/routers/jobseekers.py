"""Регистрация для поиска работы (физическое лицо) — отдельный роутер.

POST /api/v1/jobseekers — создаёт профиль соискателя (jobseeker).
Телефон — уникальный ключ: при совпадении с уже зарегистрированным
значением регистрация отклоняется кодом 409. После регистрации
пользователь сразу авторизован: ответ содержит данные личного
кабинета (та же форма, что возвращает /auth/login), фронт сохраняет
их как сессию и ведёт в личный кабинет. Пароль в базу попадает
только в виде хеша (app/security.py).

PATCH /api/v1/jobseekers/{id} — редактирование данных в личном
кабинете: ФИО, дата рождения, возраст, пол, паспорт, гражданство,
медицинская книжка. Телефон и согласие не редактируются.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.legal import is_valid_password, normalize_phone
from app.models import JobSeeker
from app.schemas import (
    AccountOut,
    JobSeekerOut,
    JobSeekerRegistrationIn,
    JobSeekerUpdateIn,
)
from app.security import hash_password

router = APIRouter(prefix="/api/v1/jobseekers", tags=["jobseekers"])

# Допустимые значения справочных полей профиля (как в личном кабинете).
GENDERS = ("Муж.", "Жен.")
CITIZENSHIPS = ("Российская Федерация", "Казахстан", "Беларусь")
MEDICAL_BOOK_VALUES = ("Да", "Нет")


def _parse_date_of_birth(value: str) -> Optional[object]:
    """Разбирает дату рождения ДД.ММ.ГГГГ. Возвращает None при ошибке."""
    try:
        return datetime.strptime(value.strip(), "%d.%m.%Y").date()
    except ValueError:
        return None


def _jobseeker_out(jobseeker: JobSeeker) -> JobSeekerOut:
    """JobSeekerOut из модели (все поля профиля)."""
    return JobSeekerOut(
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
    )


@router.patch(
    "/{jobseeker_id}",
    response_model=JobSeekerOut,
    summary="Редактирование данных соискателя",
)
def update_jobseeker(
    jobseeker_id: int,
    payload: JobSeekerUpdateIn,
    session: Session = Depends(get_session),
) -> JobSeekerOut:
    """Обновляет ФИО и поля профиля соискателя (личный кабинет).

    Согласие на обработку персональных данных не редактируется.
    Телефон — уникальный ключ — не меняется. Обязательные поля
    профиля: дата рождения (ДД.ММ.ГГГГ), возраст, пол, паспорт,
    гражданство; медицинская книжка — необязательная.
    """
    jobseeker = session.get(JobSeeker, jobseeker_id)
    if jobseeker is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Соискатель не найден",
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
    if phone != jobseeker.phone:
        other = session.exec(
            select(JobSeeker).where(JobSeeker.phone == phone)
        ).first()
        if other is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким телефоном уже зарегистрирован",
            )

    # --- Поля профиля ---
    # Дата рождения: формат ДД.ММ.ГГГГ (ограничений по диапазону нет).
    date_of_birth = _parse_date_of_birth(payload.date_of_birth)
    if date_of_birth is None:
        raise HTTPException(
            status_code=422,
            detail="Дата рождения должна быть в формате ДД.ММ.ГГГГ",
        )

    if payload.gender not in GENDERS:
        raise HTTPException(
            status_code=422,
            detail="Пол должен быть выбран из списка: Муж., Жен.",
        )

    passport = payload.passport.strip()
    if not passport:
        raise HTTPException(
            status_code=422,
            detail="Укажите серию и номер паспорта",
        )

    if payload.citizenship not in CITIZENSHIPS:
        raise HTTPException(
            status_code=422,
            detail="Гражданство должно быть выбрано из списка",
        )

    medical_book = payload.medical_book
    if medical_book is not None and medical_book not in MEDICAL_BOOK_VALUES:
        raise HTTPException(
            status_code=422,
            detail="Медицинская книжка: Да или Нет",
        )

    jobseeker.full_name = full_name
    jobseeker.phone = phone
    jobseeker.date_of_birth = date_of_birth
    jobseeker.age = payload.age
    jobseeker.gender = payload.gender
    jobseeker.passport = passport
    jobseeker.citizenship = payload.citizenship
    jobseeker.medical_book = medical_book
    try:
        session.commit()
    except IntegrityError:
        # Защита от гонки: такой телефон успел появиться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    session.refresh(jobseeker)
    return _jobseeker_out(jobseeker)


@router.post(
    "",
    response_model=AccountOut,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация для поиска работы (физическое лицо)",
)
def register_jobseeker(
    payload: JobSeekerRegistrationIn,
    session: Session = Depends(get_session),
) -> AccountOut:
    # Все поля обязательны.
    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="ФИО обязательно для заполнения")

    # Согласие на обработку персональных данных — обязательное условие.
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

    # Уникальный ключ: телефон соискателя.
    # При совпадении регистрация не производится.
    if session.exec(select(JobSeeker).where(JobSeeker.phone == phone)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    jobseeker = JobSeeker(
        full_name=full_name,
        phone=phone,
        password_hash=hash_password(payload.password),
        consent=payload.consent,
    )
    session.add(jobseeker)
    try:
        session.commit()
    except IntegrityError:
        # Защита от гонки: такой телефон успел зарегистрироваться.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    session.refresh(jobseeker)
    # Сразу авторизуем: ответ в той же форме, что и /auth/login,
    # фронт сохраняет его как сессию и ведёт в личный кабинет.
    return AccountOut(
        user_type="jobseeker",
        jobseeker=_jobseeker_out(jobseeker),
    )

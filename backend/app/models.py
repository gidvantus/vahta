"""Модели данных (SQLModel).

Схема БД создаётся миграциями Alembic (backend/alembic/versions).
Таблицы: company (компания-работодатель), city (город-справочник),
schedule (справочник графиков вахты), vacancy (вакансия вахтой),
legal_registrant / legal_company (регистрация юридического лица),
jobseeker (регистрация для поиска работы — физическое лицо).
Отдельные модули регистрации не связаны с каталогом вакансий.
"""

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Column, Text
from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    """Текущее время UTC (naive) для значений по умолчанию."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Company(SQLModel, table=True):
    """Компания-работодатель."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, min_length=2, max_length=200)
    slug: str = Field(unique=True, index=True, max_length=200)
    logo: Optional[str] = Field(default=None, max_length=500)
    verified: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)

    vacancies: list["Vacancy"] = Relationship(back_populates="company")


class City(SQLModel, table=True):
    """Город работы (справочник).

    is_main — показывать город в основной группе фильтра
    (без кнопки «Показать все»).
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, min_length=1, max_length=120)
    is_main: bool = Field(default=False, index=True)

    vacancies: list["Vacancy"] = Relationship(back_populates="city")


class Schedule(SQLModel, table=True):
    """Справочник графиков вахты.

    value — машинное значение (например "30/30"), label — как показать
    пользователю, sort_order — порядок в фильтре.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    value: str = Field(unique=True, index=True, max_length=32)
    label: str = Field(default="", max_length=64)
    sort_order: int = Field(default=0)

    vacancies: list["Vacancy"] = Relationship(back_populates="schedule_ref")


class Vacancy(SQLModel, table=True):
    """Вакансия вахтовым методом."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, min_length=3, max_length=200)
    # Транслит названия (часть полного слага карточки).
    # Например: mashinist-burovoj-ustanovki.
    slug: str = Field(index=True, max_length=200)
    # Полный слаг карточки: транслит названия + '-' + транслит организации
    # (например mashinist-burovoj-ustanovki-gazprom-neft). Уникальный адрес
    # детальной карточки /vacancy/<full_slug> — открывается по нему, а не по id.
    full_slug: str = Field(unique=True, index=True, max_length=500)
    salary_from: Optional[int] = Field(default=None, ge=0)
    salary_to: Optional[int] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_active: bool = Field(default=True, index=True)

    city_id: Optional[int] = Field(default=None, foreign_key="city.id", index=True)
    company_id: Optional[int] = Field(default=None, foreign_key="company.id", index=True)
    # График вахты берётся из справочника schedule.
    schedule_id: Optional[int] = Field(default=None, foreign_key="schedule.id", index=True)

    # --- Поля карточки вакансии (форма создания) ---
    # Зарплата в час (₽/час), отдельно от месячной salary_from/salary_to.
    salary_hourly_from: Optional[int] = Field(default=None, ge=0)
    salary_hourly_to: Optional[int] = Field(default=None, ge=0)
    # Кол-во рабочих часов в смену: 8, 9, 11, 12, 24 (можно несколько).
    hours_per_shift: list[int] = Field(default_factory=list, sa_column=Column(JSON))
    # Продолжительность вахты в днях: 15, 20, 30, 35 (можно несколько).
    shift_length: list[int] = Field(default_factory=list, sa_column=Column(JSON))
    # График работы: 1/1, 2/2, 3/3, 5/2, 6/1 (можно несколько).
    work_schedule: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    # Общежитие: адрес и схема проезда (описание + прикреплённый файл).
    dorm_address: Optional[str] = Field(default=None, max_length=300)
    dorm_route: Optional[str] = Field(default=None, sa_column=Column(Text))
    dorm_route_photo: Optional[str] = Field(default=None, max_length=500)
    # Фото места работы и проживания (пути к файлам).
    work_photos: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    dorm_photos: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    # Акции клиента: список {title, text}.
    promos: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    # Тексты карточки (многострочные).
    duties: Optional[str] = Field(default=None, sa_column=Column(Text))
    living_conditions: Optional[str] = Field(default=None, sa_column=Column(Text))
    # Питание: no | 1 | 2 | 3 (разовое).
    meals: Optional[str] = Field(default=None, max_length=16)
    # Медкнижка: yes | no | help («Да — помогаем сделать»).
    med_book: Optional[str] = Field(default=None, max_length=16)
    # Опыт работы: требуется ли и какие требования.
    experience_required: Optional[bool] = Field(default=None)
    experience_requirements: Optional[str] = Field(default=None, sa_column=Column(Text))
    # Спецодежда: yes | no | provided («Да, предоставляем»).
    clothing: Optional[str] = Field(default=None, max_length=16)
    # Оплата проезда до места работы: Да/Нет.
    travel_paid: Optional[bool] = Field(default=None)

    published_at: datetime = Field(default_factory=utcnow, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_column_kwargs={"onupdate": utcnow},
    )

    city: Optional[City] = Relationship(back_populates="vacancies")
    company: Optional[Company] = Relationship(back_populates="vacancies")
    schedule_ref: Optional[Schedule] = Relationship(back_populates="vacancies")


class LegalRegistrant(SQLModel, table=True):
    """Регистратор юридического лица (отдельный модуль регистрации).

    Персональные данные регистратора хранятся отдельно от данных
    организаций (legal_company). Телефон — уникальный ключ регистратора.
    Пароль хранится только в виде хеша (app/security.py), в открытом
    виде в базе не сохраняется.
    """

    __tablename__ = "legal_registrant"

    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(min_length=2, max_length=200)
    # Канонический вид: +7XXXXXXXXXX (12 символов).
    phone: str = Field(unique=True, index=True, max_length=16)
    # Соль + хеш PBKDF2-HMAC-SHA256 (никогда не хранить сам пароль).
    password_hash: str = Field(max_length=256)
    # Согласие на обработку персональных данных (обязательное условие).
    consent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)


class LegalCompany(SQLModel, table=True):
    """Организация, регистрируемая в отдельном модуле.

    Данные организации хранятся отдельно от данных регистратора
    (legal_registrant). ИНН — уникальный ключ организации.
    """

    __tablename__ = "legal_company"

    id: Optional[int] = Field(default=None, primary_key=True)
    # ИНН юрлица: ровно 10 цифр, проверяется контрольной суммой.
    inn: str = Field(unique=True, index=True, min_length=10, max_length=10)
    name: str = Field(min_length=2, max_length=200)
    registrant_id: int = Field(foreign_key="legal_registrant.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)


class JobSeeker(SQLModel, table=True):
    """Соискатель (физическое лицо) — отдельный модуль регистрации.

    «Регистрация для поиска работы». Телефон — уникальный ключ.
    Пароль хранится только в виде хеша (app/security.py), в открытом
    виде в базе не сохраняется. consent — согласие на обработку
    персональных данных (обязательное условие регистрации).

    Поля профиля (заполняются и редактируются в личном кабинете):
    date_of_birth (дата рождения), age (возраст), gender (пол),
    passport (серия и номер паспорта), citizenship (гражданство),
    medical_book (медицинская книжка: Да/Нет, необязательное).
    """

    __tablename__ = "jobseeker"

    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(min_length=2, max_length=200)
    # Канонический вид: +7XXXXXXXXXX (12 символов).
    phone: str = Field(unique=True, index=True, max_length=16)
    password_hash: str = Field(max_length=256)
    consent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)

    # --- Профиль (личный кабинет) ---
    date_of_birth: Optional[date] = Field(default=None)
    age: Optional[int] = Field(default=None, ge=0, le=130)
    gender: Optional[str] = Field(default=None, max_length=16)
    passport: Optional[str] = Field(default=None, max_length=30)
    citizenship: Optional[str] = Field(default=None, max_length=64)
    medical_book: Optional[str] = Field(default=None, max_length=16)

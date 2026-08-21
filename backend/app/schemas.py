"""Pydantic-схемы ответов API (модели чтения)."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class VacancyOut(SQLModel):
    """Вакансия в плоском виде — готово для карточки на фронте."""

    id: int
    title: str
    slug: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    schedule: str
    description: Optional[str] = None
    city: str
    company: str
    logo: Optional[str] = None
    verified: bool = False
    published_at: datetime


class VacancyListOut(SQLModel):
    items: list[VacancyOut]
    total: int
    page: int
    page_size: int


class CityCount(SQLModel):
    name: str
    count: int
    is_main: bool = False


class ScheduleCount(SQLModel):
    value: str
    label: str
    count: int


class SalaryCount(SQLModel):
    value: str
    label: str
    min: Optional[int] = None
    count: int


class FiltersOut(SQLModel):
    """Данные для сайдбара фильтров (как на фронте)."""

    cities: list[CityCount]
    schedules: list[ScheduleCount]
    salary: list[SalaryCount]


class CompanyOut(SQLModel):
    id: int
    name: str
    slug: str
    logo: Optional[str] = None
    verified: bool
    vacancies_count: int = 0


class LegalRegistrationIn(SQLModel):
    """Входные данные формы регистрации юридического лица.

    Телефон и ИНН — уникальные ключи: при совпадении с уже
    зарегистрированными значениями регистрация отклоняется (409).
    Все поля обязательны, consent должен быть True. Пароль передаётся
    только на время запроса: в базе сохраняется его хеш, а не он сам.
    """

    full_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(max_length=32)
    inn: str = Field(min_length=10, max_length=10)
    company_name: str = Field(min_length=2, max_length=200)
    # Длина и состав проверяются в роутере (со своими сообщениями об ошибке).
    password: str = Field(max_length=128)
    password_confirm: str = Field(max_length=128)
    consent: bool = False


class LegalRegistrationOut(SQLModel):
    """Результат успешной регистрации юридического лица."""

    id: int
    full_name: str
    phone: str
    inn: str
    company_name: str
    created_at: datetime


class LegalRegistrantOut(SQLModel):
    """Данные регистратора для личного кабинета.

    Пароль и его хеш (password_hash) никогда не включаются в ответ.
    """

    id: int
    full_name: str
    phone: str
    consent: bool
    created_at: datetime


class LegalCompanyOut(SQLModel):
    """Данные организации для личного кабинета."""

    id: int
    inn: str
    name: str
    created_at: datetime


class LegalAccountOut(SQLModel):
    """Данные личного кабинета: регистратор и его организации."""

    registrant: LegalRegistrantOut
    companies: list[LegalCompanyOut]

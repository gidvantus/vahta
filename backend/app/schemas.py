"""Pydantic-схемы ответов API (модели чтения)."""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class VacancyOut(SQLModel):
    """Вакансия в плоском виде — готово для карточки на фронте."""

    id: int
    title: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    schedule: str
    description: Optional[str] = None
    city: str
    company: str
    logo: Optional[str] = None
    published_at: datetime


class VacancyListOut(SQLModel):
    items: list[VacancyOut]
    total: int
    page: int
    page_size: int


class CityCount(SQLModel):
    name: str
    count: int


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

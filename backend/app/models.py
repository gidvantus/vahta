"""Модели данных (SQLModel).

Схема БД создаётся миграциями Alembic (backend/alembic/versions).
Таблицы: company (компания-работодатель), city (город),
vacancy (вакансия вахтой).
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, Text
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
    """Город работы."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, min_length=1, max_length=120)

    vacancies: list["Vacancy"] = Relationship(back_populates="city")


class Vacancy(SQLModel, table=True):
    """Вакансия вахтовым методом."""

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, min_length=3, max_length=200)
    salary_from: Optional[int] = Field(default=None, ge=0)
    salary_to: Optional[int] = Field(default=None, ge=0)
    # График вахты, например "30/30", "60/30", "15/15".
    schedule: str = Field(index=True, max_length=32)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_active: bool = Field(default=True, index=True)

    city_id: Optional[int] = Field(default=None, foreign_key="city.id", index=True)
    company_id: Optional[int] = Field(default=None, foreign_key="company.id", index=True)

    published_at: datetime = Field(default_factory=utcnow, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_column_kwargs={"onupdate": utcnow},
    )

    city: Optional[City] = Relationship(back_populates="vacancies")
    company: Optional[Company] = Relationship(back_populates="vacancies")

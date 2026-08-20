"""Общие функции выборки вакансий по фильтрам.

Используются роутерами vacancies и filters, чтобы логика
фильтрации была в одном месте.
"""

from typing import Optional

from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.models import City, Company, Schedule, Vacancy
from app.schemas import VacancyOut

# Опции зарплаты: value, label, min (None — любое), specified_only
SALARY_OPTIONS = (
    ("any", "Любая", None, False),
    ("specified", "Указана зарплата", None, True),
    ("100k", "от 100 000 ₽", 100_000, False),
    ("150k", "от 150 000 ₽", 150_000, False),
    ("200k", "от 200 000 ₽", 200_000, False),
)


def vacancy_conditions(
    q: Optional[str] = None,
    cities: Optional[list[str]] = None,
    salary_min: Optional[int] = None,
    salary_specified: Optional[bool] = None,
    schedule: Optional[str] = None,
) -> list:
    """SQL-условия для выборки вакансий (активные + фильтры).

    Требует, чтобы к запросу были присоединены city, company
    (для текстового поиска по городу и компании) и schedule_ref
    (для поиска/фильтра по графику вахты).
    """
    conds = [Vacancy.is_active.is_(True)]

    if q:
        like = f"%{q.strip().lower()}%"
        conds.append(
            or_(
                func.lower(Vacancy.title).like(like),
                func.lower(Schedule.value).like(like),
                func.lower(City.name).like(like),
                func.lower(Company.name).like(like),
            )
        )

    if cities:
        conds.append(City.name.in_(cities))

    if salary_min is not None:
        # NULL-зарплата автоматически исключается сравнением.
        conds.append(Vacancy.salary_from >= salary_min)

    if salary_specified:
        conds.append(Vacancy.salary_from.is_not(None))

    # График вахты — значение из справочника schedule.
    if schedule == "other":
        conds.append(Vacancy.schedule_id.is_(None))
    elif schedule:
        conds.append(Schedule.value == schedule)

    return conds


def order_for(sort: str):
    """ORDER BY для вариантов сортировки фронта."""
    if sort == "salary-desc":
        return [Vacancy.salary_from.desc().nullslast()]
    if sort == "salary-asc":
        return [Vacancy.salary_from.asc().nullslast()]
    return [Vacancy.published_at.desc(), Vacancy.id.desc()]


def to_vacancy_out(v: Vacancy) -> VacancyOut:
    """Собирает плоскую модель ответа из модели БД."""
    return VacancyOut(
        id=v.id,
        title=v.title,
        salary_from=v.salary_from,
        salary_to=v.salary_to,
        schedule=v.schedule_ref.value if v.schedule_ref else "",
        description=v.description,
        city=v.city.name if v.city else "",
        company=v.company.name if v.company else "",
        logo=v.company.logo if v.company else None,
        verified=v.company.verified if v.company else False,
        published_at=v.published_at,
    )

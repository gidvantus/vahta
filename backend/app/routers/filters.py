"""Роутер данных для сайдбара фильтров (города, графики, зарплата)."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import City, Vacancy
from app.schemas import CityCount, FiltersOut, SalaryCount, ScheduleCount
from app.service import SALARY_OPTIONS, STANDARD_SCHEDULES

router = APIRouter(prefix="/api/v1/filters", tags=["filters"])


@router.get("", response_model=FiltersOut, summary="Данные для фильтров (сайдбар)")
def get_filters(session: Session = Depends(get_session)) -> FiltersOut:
    # --- Города: имя + число активных вакансий ---
    city_rows = session.exec(
        select(City.name, func.count(Vacancy.id))
        .outerjoin(Vacancy, (Vacancy.city_id == City.id) & Vacancy.is_active.is_(True))
        .group_by(City.name)
        .order_by(func.count(Vacancy.id).desc(), City.name)
    ).all()
    cities = [CityCount(name=r[0], count=r[1]) for r in city_rows]

    # --- Графики вахты ---
    sched_rows = session.exec(
        select(Vacancy.schedule, func.count())
        .where(Vacancy.is_active.is_(True))
        .group_by(Vacancy.schedule)
    ).all()
    counts = {s: c for s, c in sched_rows}

    schedules = [
        ScheduleCount(value=value, label=value, count=counts.get(value, 0))
        for value in STANDARD_SCHEDULES
    ]
    other = sum(c for s, c in sched_rows if s not in STANDARD_SCHEDULES)
    schedules.append(ScheduleCount(value="other", label="Другой", count=other))

    # --- Зарплата: считаем по фактическому распределению salary_from ---
    salaries = session.exec(
        select(Vacancy.salary_from).where(Vacancy.is_active.is_(True))
    ).all()
    total = len(salaries)

    salary: list[SalaryCount] = []
    for value, label, minimum, specified_only in SALARY_OPTIONS:
        if specified_only:
            cnt = sum(1 for s in salaries if s is not None)
        elif minimum is None:
            cnt = total
        else:
            cnt = sum(1 for s in salaries if s is not None and s >= minimum)
        salary.append(SalaryCount(value=value, label=label, min=minimum, count=cnt))

    return FiltersOut(cities=cities, schedules=schedules, salary=salary)

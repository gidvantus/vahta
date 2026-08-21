"""Роутер данных для сайдбара фильтров (города, графики, зарплата).

Города и графики вахты берутся из справочников (city, schedule):
фильтр показывает весь справочник, а счётчики считаются по активным
вакансиям.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import City, Schedule, Vacancy
from app.schemas import CityCount, FiltersOut, SalaryCount, ScheduleCount
from app.service import SALARY_OPTIONS

router = APIRouter(prefix="/api/v1/filters", tags=["filters"])


@router.get("", response_model=FiltersOut, summary="Данные для фильтров (сайдбар)")
def get_filters(session: Session = Depends(get_session)) -> FiltersOut:
    # --- Города из справочника: имя + флаг is_main + число активных вакансий ---
    city_rows = session.exec(
        select(City.name, City.is_main, func.count(Vacancy.id))
        .outerjoin(
            Vacancy,
            (Vacancy.city_id == City.id) & (Vacancy.status == "published"),
        )
        .group_by(City.name, City.is_main)
        .order_by(func.count(Vacancy.id).desc(), City.name)
    ).all()
    cities = [
        CityCount(name=r[0], count=r[2], is_main=r[1])
        for r in city_rows
    ]

    # --- Графики вахты из справочника schedule ---
    sched_rows = session.exec(
        select(Schedule.value, Schedule.label, Schedule.sort_order, func.count(Vacancy.id))
        .outerjoin(
            Vacancy,
            (Vacancy.schedule_id == Schedule.id) & (Vacancy.status == "published"),
        )
        .group_by(Schedule.value, Schedule.label, Schedule.sort_order)
        .order_by(Schedule.sort_order)
    ).all()

    schedules = [
        ScheduleCount(value=r[0], label=r[1], count=r[3])
        for r in sched_rows
    ]

    # «Другой» — активные вакансии без графика из справочника.
    other = session.exec(
        select(func.count())
        .select_from(Vacancy)
        .where(Vacancy.status == "published", Vacancy.schedule_id.is_(None))
    ).one()
    schedules.append(ScheduleCount(value="other", label="Другой", count=other))

    # --- Зарплата: считаем по фактическому распределению salary_from ---
    salaries = session.exec(
        select(Vacancy.salary_from).where(Vacancy.status == "published")
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

"""Роутер вакансий: список с фильтрами и карточка по id."""

from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import Vacancy
from app.schemas import VacancyListOut, VacancyOut
from app.service import order_for, to_vacancy_out, vacancy_conditions

router = APIRouter(prefix="/api/v1/vacancies", tags=["vacancies"])


@router.get("", response_model=VacancyListOut, summary="Список вакансий с фильтрами")
def list_vacancies(
    q: Optional[str] = Query(None, description="Поиск по названию, городу или компании"),
    cities: Optional[str] = Query(None, description="Города через запятую, например: Москва,Тобольск"),
    salary_min: Optional[int] = Query(None, ge=0, description="Минимальная зарплата (от)"),
    salary_specified: Optional[bool] = Query(None, description="Только вакансии с указанной зарплатой"),
    schedule: Optional[str] = Query(None, description="График вахты из справочника: 15/15, 30/30 … или other"),
    sort: Literal["date", "salary-desc", "salary-asc"] = Query("date", description="Сортировка"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    page_size: int = Query(20, ge=1, le=100, description="Размер страницы"),
    session: Session = Depends(get_session),
) -> VacancyListOut:
    city_list = [c.strip() for c in cities.split(",") if c.strip()] if cities else None

    conds = vacancy_conditions(
        q=q,
        cities=city_list,
        salary_min=salary_min,
        salary_specified=salary_specified,
        schedule=schedule,
    )

    total = session.exec(
        select(func.count())
        .select_from(Vacancy)
        .join(Vacancy.city)
        .join(Vacancy.company)
        .outerjoin(Vacancy.schedule_ref)
        .where(*conds)
    ).one()

    rows = session.exec(
        select(Vacancy)
        .join(Vacancy.city)
        .join(Vacancy.company)
        .outerjoin(Vacancy.schedule_ref)
        .where(*conds)
        .order_by(*order_for(sort))
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    items = [to_vacancy_out(v) for v in rows]
    return VacancyListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{vacancy_id}", response_model=VacancyOut, summary="Вакансия по id")
def get_vacancy(
    vacancy_id: int,
    session: Session = Depends(get_session),
) -> VacancyOut:
    v = session.get(Vacancy, vacancy_id)
    if v is None or not v.is_active:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return to_vacancy_out(v)

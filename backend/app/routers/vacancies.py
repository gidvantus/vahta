"""Роутер вакансий: список с фильтрами, карточка по id и создание."""

from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import Vacancy
from app.schemas import VacancyCreate, VacancyListOut, VacancyOut
from app.service import (
    get_or_create_city,
    get_or_create_company,
    order_for,
    to_vacancy_out,
    vacancy_conditions,
)

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


@router.post("", response_model=VacancyOut, status_code=201, summary="Создать вакансию")
def create_vacancy(
    payload: VacancyCreate,
    session: Session = Depends(get_session),
) -> VacancyOut:
    """Создаёт вакансию из данных формы.

    Город берётся по названию (при отсутствии создаётся). Компания
    необязательна: название появится, когда будет реализован профиль
    компании (пока вакансии создаются без привязки к компании).
    """
    try:
        city = get_or_create_city(session, payload.city)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    company_id = None
    if payload.company and payload.company.strip():
        company_id = get_or_create_company(session, payload.company).id

    vacancy = Vacancy(
        title=payload.title,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        salary_hourly_from=payload.salary_hourly_from,
        salary_hourly_to=payload.salary_hourly_to,
        hours_per_shift=payload.hours_per_shift,
        shift_length=payload.shift_length,
        work_schedule=payload.work_schedule,
        description=payload.description,
        city_id=city.id,
        company_id=company_id,
        dorm_address=payload.dorm_address,
        dorm_route=payload.dorm_route,
        dorm_route_photo=payload.dorm_route_photo,
        work_photos=payload.work_photos,
        dorm_photos=payload.dorm_photos,
        promos=[p.model_dump() for p in payload.promos],
        duties=payload.duties,
        living_conditions=payload.living_conditions,
        meals=payload.meals,
        med_book=payload.med_book,
        experience_required=payload.experience_required,
        experience_requirements=payload.experience_requirements,
        clothing=payload.clothing,
        travel_paid=payload.travel_paid,
    )
    session.add(vacancy)
    session.commit()
    saved = session.get(Vacancy, vacancy.id)
    return to_vacancy_out(saved)

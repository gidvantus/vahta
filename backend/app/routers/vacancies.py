"""Роутер вакансий: список с фильтрами, карточка по слагу и создание."""

from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.db import get_session
from app.models import Vacancy
from app.schemas import VacancyCreate, VacancyListOut, VacancyOut, VacancyStatusIn
from app.service import (
    get_or_create_city,
    get_or_create_company,
    make_full_slug,
    make_unique_full_slug,
    order_for,
    to_vacancy_out,
    vacancy_conditions,
)
from app.translit import translit_slug

router = APIRouter(prefix="/api/v1/vacancies", tags=["vacancies"])


@router.get("", response_model=VacancyListOut, summary="Список вакансий с фильтрами")
def list_vacancies(
    q: Optional[str] = Query(None, description="Поиск по названию, городу или компании"),
    cities: Optional[str] = Query(None, description="Города через запятую, например: Москва,Тобольск"),
    salary_min: Optional[int] = Query(None, ge=0, description="Минимальная зарплата (от)"),
    salary_specified: Optional[bool] = Query(None, description="Только вакансии с указанной зарплатой"),
    schedule: Optional[str] = Query(None, description="График вахты из справочника: 15/15, 30/30 … или other"),
    sort: Literal["date", "salary-desc", "salary-asc"] = Query("date", description="Сортировка"),
    legal_company_id: Optional[int] = Query(None, description="Вакансии организации из личного кабинета"),
    status: Optional[str] = Query(None, description="Статус для списка компании: draft, published, archived"),
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
        legal_company_id=legal_company_id,
        status=status,
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


@router.get("/slug/{slug}", response_model=VacancyOut, summary="Вакансия по полному слагу (транслит названия + организации)")
def get_vacancy_by_slug(
    slug: str,
    session: Session = Depends(get_session),
) -> VacancyOut:
    """Ищет вакансию по полному слагу карточки.

    Полный слаг — транслит названия + '-' + транслит организации
    (например mashinist-burovoj-ustanovki-gazprom-neft). Для старых
    ссылок дополнительно ищет по слагу одного названия.
    """
    v = session.exec(
        select(Vacancy)
        .where(
            Vacancy.status == "published",
            or_(Vacancy.full_slug == slug, Vacancy.slug == slug),
        )
        .order_by(Vacancy.id)
    ).first()
    if v is None:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return to_vacancy_out(v)


@router.get("/{vacancy_id}", response_model=VacancyOut, summary="Вакансия по id")
def get_vacancy(
    vacancy_id: int,
    session: Session = Depends(get_session),
) -> VacancyOut:
    v = session.get(Vacancy, vacancy_id)
    if v is None or v.status != "published":
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    return to_vacancy_out(v)


@router.patch("/{vacancy_id}/status", response_model=VacancyOut, summary="Изменить статус вакансии")
def set_vacancy_status(
    vacancy_id: int,
    payload: VacancyStatusIn,
    session: Session = Depends(get_session),
) -> VacancyOut:
    """Переводит вакансию между вкладками «Списка вакансий» компании.

    draft (не опубликована/черновик) → published (опубликована, видна
    в каталоге) → archived (архив) и обратно.
    """
    allowed = {"draft", "published", "archived"}
    if payload.status not in allowed:
        raise HTTPException(status_code=422, detail="Недопустимый статус вакансии")

    v = session.get(Vacancy, vacancy_id)
    if v is None:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    v.status = payload.status
    session.add(v)
    session.commit()
    session.refresh(v)
    return to_vacancy_out(v)


@router.post("", response_model=VacancyOut, status_code=201, summary="Создать вакансию")
def create_vacancy(
    payload: VacancyCreate,
    session: Session = Depends(get_session),
) -> VacancyOut:
    """Создаёт вакансию из данных формы.

    Город и компания берутся по названию (при отсутствии создаются).
    Компания передаётся из профиля (личного кабинета) — название
    подтягивается в форму создания автоматически. slug — транслит
    названия, full_slug — транслит названия + транслит организации
    (уникальный адрес карточки /vacancy/<full_slug>).
    """
    try:
        city = get_or_create_city(session, payload.city)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    company = None
    if payload.company and payload.company.strip():
        company = get_or_create_company(session, payload.company)

    # slug: транслит названия; full_slug: транслит названия + организации.
    title_slug = translit_slug(payload.title) or f"vacancy-{uuid4().hex[:6]}"
    full_slug = make_unique_full_slug(
        session,
        make_full_slug(title_slug, company.slug if company else None),
    )

    vacancy = Vacancy(
        title=payload.title,
        slug=title_slug,
        full_slug=full_slug,
        # Новая вакансия попадает во вкладку «Не опубликованные (Черновик)».
        status="draft",
        legal_company_id=payload.legal_company_id,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        salary_hourly_from=payload.salary_hourly_from,
        salary_hourly_to=payload.salary_hourly_to,
        hours_per_shift=payload.hours_per_shift,
        shift_length=payload.shift_length,
        work_schedule=payload.work_schedule,
        description=payload.description,
        city_id=city.id,
        company_id=company.id if company else None,
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

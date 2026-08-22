"""Избранные вакансии вахтовика.

GET    /api/v1/favorites?jobseeker_id= — список вакансий.
GET    /api/v1/favorites/ids?jobseeker_id= — только id.
POST   /api/v1/favorites — добавить.
DELETE /api/v1/favorites?vacancy_id=&jobseeker_id= — убрать.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.models import JobSeeker, Vacancy, VacancyFavorite
from app.schemas import FavoriteCreate, FavoriteIdsOut, VacancyListOut
from app.service import blocked_company_ids, is_jobseeker_blocked, to_vacancy_out

router = APIRouter(prefix="/api/v1/favorites", tags=["favorites"])


def _require_jobseeker(session: Session, jobseeker_id: int) -> JobSeeker:
    person = session.get(JobSeeker, jobseeker_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Соискатель не найден")
    return person


@router.get("/ids", response_model=FavoriteIdsOut, summary="Id избранных вакансий")
def list_favorite_ids(
    jobseeker_id: int = Query(...),
    session: Session = Depends(get_session),
) -> FavoriteIdsOut:
    _require_jobseeker(session, jobseeker_id)
    hidden = set(blocked_company_ids(session, jobseeker_id))
    rows = session.exec(
        select(VacancyFavorite.vacancy_id, Vacancy.legal_company_id, Vacancy.status)
        .join(Vacancy, Vacancy.id == VacancyFavorite.vacancy_id)
        .where(VacancyFavorite.jobseeker_id == jobseeker_id)
    ).all()
    ids = [
        vacancy_id
        for vacancy_id, company_id, _status in rows
        if company_id is None or company_id not in hidden
    ]
    return FavoriteIdsOut(ids=ids)


@router.get("", response_model=VacancyListOut, summary="Избранные вакансии")
def list_favorites(
    jobseeker_id: int = Query(...),
    session: Session = Depends(get_session),
) -> VacancyListOut:
    _require_jobseeker(session, jobseeker_id)
    hidden = set(blocked_company_ids(session, jobseeker_id))
    favs = session.exec(
        select(VacancyFavorite)
        .where(VacancyFavorite.jobseeker_id == jobseeker_id)
        .order_by(VacancyFavorite.created_at.desc())
    ).all()
    items = []
    for fav in favs:
        vacancy = session.get(Vacancy, fav.vacancy_id)
        if vacancy is None:
            continue
        if vacancy.legal_company_id in hidden:
            continue
        items.append(to_vacancy_out(vacancy))
    return VacancyListOut(items=items, total=len(items), page=1, page_size=len(items) or 20)


@router.post("", status_code=201, summary="Добавить в избранное")
def add_favorite(
    payload: FavoriteCreate,
    session: Session = Depends(get_session),
) -> dict:
    _require_jobseeker(session, payload.jobseeker_id)
    vacancy = session.get(Vacancy, payload.vacancy_id)
    if vacancy is None or vacancy.status != "published":
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    if is_jobseeker_blocked(session, payload.jobseeker_id, vacancy.legal_company_id):
        raise HTTPException(status_code=403, detail="Вакансии этой компании недоступны")

    session.add(
        VacancyFavorite(
            vacancy_id=vacancy.id,
            jobseeker_id=payload.jobseeker_id,
        )
    )
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Вакансия уже в избранном") from exc
    return {"ok": True}


@router.delete("", summary="Убрать из избранного")
def remove_favorite(
    vacancy_id: int = Query(...),
    jobseeker_id: int = Query(...),
    session: Session = Depends(get_session),
) -> dict:
    _require_jobseeker(session, jobseeker_id)
    fav = session.exec(
        select(VacancyFavorite).where(
            VacancyFavorite.vacancy_id == vacancy_id,
            VacancyFavorite.jobseeker_id == jobseeker_id,
        )
    ).first()
    if fav is None:
        return {"ok": True}
    session.delete(fav)
    session.commit()
    return {"ok": True}

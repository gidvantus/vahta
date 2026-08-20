"""Справочники: компании и города."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import City, Company, Vacancy
from app.schemas import CompanyOut

router = APIRouter(prefix="/api/v1", tags=["meta"])


@router.get("/companies", response_model=list[CompanyOut], summary="Компании с числом вакансий")
def list_companies(session: Session = Depends(get_session)) -> list[CompanyOut]:
    rows = session.exec(
        select(
            Company.id,
            Company.name,
            Company.slug,
            Company.logo,
            Company.verified,
            func.count(Vacancy.id),
        )
        .outerjoin(Vacancy, Vacancy.company_id == Company.id)
        .group_by(Company.id, Company.name, Company.slug, Company.logo, Company.verified)
        .order_by(Company.name)
    ).all()
    return [
        CompanyOut(id=r[0], name=r[1], slug=r[2], logo=r[3], verified=r[4], vacancies_count=r[5])
        for r in rows
    ]


@router.get("/cities", response_model=list[str], summary="Все города")
def list_cities(session: Session = Depends(get_session)) -> list[str]:
    rows = session.exec(select(City.name).order_by(City.name)).all()
    return list(rows)

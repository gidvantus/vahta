"""Отклики вахтовиков на вакансии.

POST /api/v1/applications — вахтовик откликается на опубликованную вакансию.
GET  /api/v1/applications?legal_company_id= — отклики организации.
GET  /api/v1/applications?jobseeker_id= — отклики вахтовика.
PATCH /api/v1/applications/{id}/decision — решение работодателя.
"""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.models import (
    CompanyJobseekerBlock,
    JobSeeker,
    Vacancy,
    VacancyApplication,
)
from app.models import utcnow
from app.schemas import (
    ApplicationCreate,
    ApplicationDecisionIn,
    ApplicationJobSeekerOut,
    ApplicationOut,
    ApplicationUnblockIn,
    ApplicationVacancyOut,
    ApplicationWorkConfirmIn,
    ApplicationWorkIn,
    ApplicationFinishRejectIn,
)
from app.service import is_jobseeker_blocked

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])

REJECT_COOLDOWN_DAYS = 15


def _block_for(
    session: Session, legal_company_id: Optional[int], jobseeker_id: int
) -> Optional[CompanyJobseekerBlock]:
    if legal_company_id is None:
        return None
    return session.exec(
        select(CompanyJobseekerBlock).where(
            CompanyJobseekerBlock.legal_company_id == legal_company_id,
            CompanyJobseekerBlock.jobseeker_id == jobseeker_id,
        )
    ).first()


def _to_out(
    app: VacancyApplication,
    vacancy: Vacancy,
    jobseeker: JobSeeker,
    block: Optional[CompanyJobseekerBlock] = None,
) -> ApplicationOut:
    was_blocked = block is not None and not block.is_active
    return ApplicationOut(
        id=app.id,
        created_at=app.created_at,
        status=app.status,
        decision_reason=app.decision_reason,
        decided_at=app.decided_at,
        vacancy=ApplicationVacancyOut(
            id=vacancy.id,
            title=vacancy.title,
            full_slug=vacancy.full_slug or "",
            city=vacancy.city.name if vacancy.city else "",
            company=vacancy.company.name if vacancy.company else "",
        ),
        jobseeker=ApplicationJobSeekerOut(
            id=jobseeker.id,
            full_name=jobseeker.full_name,
            phone=jobseeker.phone,
        ),
        previously_blocked=was_blocked,
        last_block_reason=block.reason if was_blocked else None,
        work_status=app.work_status or "none",
        arrival_confirmed=bool(app.arrival_confirmed),
        start_confirmed=bool(app.start_confirmed),
        finish_confirmed=bool(app.finish_confirmed),
        finish_reject_kind=app.finish_reject_kind,
        finish_reject_reason=app.finish_reject_reason,
    )


@router.post("", response_model=ApplicationOut, status_code=201, summary="Откликнуться на вакансию")
def create_application(
    payload: ApplicationCreate,
    session: Session = Depends(get_session),
) -> ApplicationOut:
    vacancy = session.get(Vacancy, payload.vacancy_id)
    if vacancy is None or vacancy.status != "published":
        raise HTTPException(status_code=404, detail="Вакансия не найдена")

    jobseeker = session.get(JobSeeker, payload.jobseeker_id)
    if jobseeker is None:
        raise HTTPException(status_code=404, detail="Соискатель не найден")

    if is_jobseeker_blocked(session, jobseeker.id, vacancy.legal_company_id):
        raise HTTPException(
            status_code=403,
            detail="Работодатель заблокировал вас: вакансии этой компании недоступны",
        )

    existing = session.exec(
        select(VacancyApplication).where(
            VacancyApplication.vacancy_id == vacancy.id,
            VacancyApplication.jobseeker_id == jobseeker.id,
        )
    ).first()

    if existing is not None:
        if existing.status == "blocked":
            raise HTTPException(
                status_code=403,
                detail="Работодатель заблокировал вас: вакансии этой компании недоступны",
            )
        if existing.status == "rejected" and existing.decided_at is not None:
            unlock_at = existing.decided_at + timedelta(days=REJECT_COOLDOWN_DAYS)
            now = utcnow()
            if now < unlock_at:
                days = max(1, (unlock_at.date() - now.date()).days)
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Повторно откликнуться на эту вакансию можно через "
                        f"{days} дн. после отказа"
                    ),
                )
            existing.status = "pending"
            existing.decision_reason = None
            existing.decided_at = None
            existing.work_status = "none"
            existing.arrival_confirmed = False
            existing.start_confirmed = False
            existing.finish_confirmed = False
            existing.finish_reject_kind = None
            existing.finish_reject_reason = None
            existing.created_at = now
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return _to_out(
                existing,
                vacancy,
                jobseeker,
                _block_for(session, vacancy.legal_company_id, jobseeker.id),
            )
        raise HTTPException(
            status_code=409,
            detail="Вы уже откликнулись на эту вакансию",
        )

    app = VacancyApplication(
        vacancy_id=vacancy.id,
        jobseeker_id=jobseeker.id,
        status="pending",
    )
    session.add(app)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Вы уже откликнулись на эту вакансию",
        ) from exc

    saved = session.get(VacancyApplication, app.id)
    vacancy = session.get(Vacancy, saved.vacancy_id)
    jobseeker = session.get(JobSeeker, saved.jobseeker_id)
    return _to_out(
        saved,
        vacancy,
        jobseeker,
        _block_for(session, vacancy.legal_company_id, jobseeker.id),
    )


@router.get("", response_model=list[ApplicationOut], summary="Список откликов")
def list_applications(
    legal_company_id: Optional[int] = Query(None, description="Отклики организации"),
    jobseeker_id: Optional[int] = Query(None, description="Отклики вахтовика"),
    session: Session = Depends(get_session),
) -> list[ApplicationOut]:
    if legal_company_id is not None:
        query = (
            select(VacancyApplication)
            .join(Vacancy)
            .where(Vacancy.legal_company_id == legal_company_id)
        )
    elif jobseeker_id is not None:
        query = select(VacancyApplication).where(
            VacancyApplication.jobseeker_id == jobseeker_id
        )
    else:
        raise HTTPException(
            status_code=422,
            detail="Укажите legal_company_id или jobseeker_id",
        )

    apps = session.exec(
        query.order_by(VacancyApplication.created_at.desc())
    ).all()

    items = []
    for app in apps:
        vacancy = session.get(Vacancy, app.vacancy_id)
        jobseeker = session.get(JobSeeker, app.jobseeker_id)
        if vacancy is None or jobseeker is None:
            continue
        items.append(
            _to_out(
                app,
                vacancy,
                jobseeker,
                _block_for(session, vacancy.legal_company_id, jobseeker.id),
            )
        )
    return items


@router.patch(
    "/{application_id}/decision",
    response_model=ApplicationOut,
    summary="Решение по отклику",
)
def decide_application(
    application_id: int,
    payload: ApplicationDecisionIn,
    session: Session = Depends(get_session),
) -> ApplicationOut:
    app = session.get(VacancyApplication, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    vacancy = session.get(Vacancy, app.vacancy_id)
    jobseeker = session.get(JobSeeker, app.jobseeker_id)
    if vacancy is None or jobseeker is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if vacancy.legal_company_id != payload.legal_company_id:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    if payload.action in ("rejected", "blocked"):
        reason = (payload.reason or "").strip()
        if len(reason) < 3:
            raise HTTPException(status_code=422, detail="Укажите причину")
    else:
        reason = None

    now = utcnow()
    app.status = payload.action
    app.decision_reason = reason
    app.decided_at = now
    if payload.action == "accepted":
        app.work_status = "none"
        app.arrival_confirmed = False
        app.start_confirmed = False
        app.finish_confirmed = False
        app.finish_reject_kind = None
        app.finish_reject_reason = None
    session.add(app)

    if payload.action == "blocked":
        existing_block = session.exec(
            select(CompanyJobseekerBlock).where(
                CompanyJobseekerBlock.legal_company_id == payload.legal_company_id,
                CompanyJobseekerBlock.jobseeker_id == jobseeker.id,
            )
        ).first()
        if existing_block is None:
            session.add(
                CompanyJobseekerBlock(
                    legal_company_id=payload.legal_company_id,
                    jobseeker_id=jobseeker.id,
                    reason=reason,
                    is_active=True,
                )
            )
        else:
            existing_block.reason = reason
            existing_block.is_active = True
            session.add(existing_block)

        related = session.exec(
            select(VacancyApplication)
            .join(Vacancy)
            .where(
                VacancyApplication.jobseeker_id == jobseeker.id,
                Vacancy.legal_company_id == payload.legal_company_id,
            )
        ).all()
        for other in related:
            other.status = "blocked"
            other.decision_reason = reason
            other.decided_at = now
            session.add(other)

    session.commit()
    session.refresh(app)
    vacancy = session.get(Vacancy, app.vacancy_id)
    jobseeker = session.get(JobSeeker, app.jobseeker_id)
    return _to_out(
        app,
        vacancy,
        jobseeker,
        _block_for(session, vacancy.legal_company_id, jobseeker.id),
    )


@router.patch(
    "/{application_id}/unblock",
    summary="Разблокировать вахтовика",
)
def unblock_jobseeker(
    application_id: int,
    payload: ApplicationUnblockIn,
    session: Session = Depends(get_session),
) -> dict:
    app = session.get(VacancyApplication, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    vacancy = session.get(Vacancy, app.vacancy_id)
    if vacancy is None or vacancy.legal_company_id != payload.legal_company_id:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    jobseeker_id = app.jobseeker_id
    block = _block_for(session, payload.legal_company_id, jobseeker_id)
    if block is not None:
        block.is_active = False
        session.add(block)

    related = session.exec(
        select(VacancyApplication)
        .join(Vacancy)
        .where(
            VacancyApplication.jobseeker_id == jobseeker_id,
            Vacancy.legal_company_id == payload.legal_company_id,
        )
    ).all()
    for row in related:
        session.delete(row)

    session.commit()
    return {"ok": True}


@router.patch(
    "/{application_id}/work",
    response_model=ApplicationOut,
    summary="Вахтовик: выехал или вышел на работу",
)
def set_work_progress(
    application_id: int,
    payload: ApplicationWorkIn,
    session: Session = Depends(get_session),
) -> ApplicationOut:
    app = session.get(VacancyApplication, application_id)
    if app is None or app.jobseeker_id != payload.jobseeker_id:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if app.status != "accepted":
        raise HTTPException(status_code=422, detail="Сначала работодатель должен принять отклик")

    if payload.action == "departed":
        if (app.work_status or "none") != "none":
            raise HTTPException(status_code=409, detail="Выезд уже отмечен")
        app.work_status = "departed"
    elif payload.action == "started":
        if (app.work_status or "none") != "departed":
            raise HTTPException(status_code=422, detail="Сначала отметьте, что выехали на работу")
        app.work_status = "started"
    else:
        if not app.start_confirmed:
            raise HTTPException(status_code=422, detail="Работодатель ещё не подтвердил выход на работу")
        if app.finish_reject_kind == "wont_continue":
            raise HTTPException(status_code=422, detail="Завершение работы отклонено работодателем")
        stage = app.work_status or "none"
        if stage == "finished" and app.finish_reject_kind != "incomplete":
            raise HTTPException(status_code=409, detail="Завершение уже отправлено работодателю")
        if stage not in ("started", "finished"):
            raise HTTPException(status_code=422, detail="Сейчас нельзя завершить работу")
        app.work_status = "finished"
        app.finish_confirmed = False
        app.finish_reject_kind = None
        app.finish_reject_reason = None

    session.add(app)
    session.commit()
    session.refresh(app)
    vacancy = session.get(Vacancy, app.vacancy_id)
    jobseeker = session.get(JobSeeker, app.jobseeker_id)
    return _to_out(
        app,
        vacancy,
        jobseeker,
        _block_for(session, vacancy.legal_company_id, jobseeker.id),
    )


@router.patch(
    "/{application_id}/work-confirm",
    response_model=ApplicationOut,
    summary="Компания: подтвердить приезд или выход",
)
def confirm_work_progress(
    application_id: int,
    payload: ApplicationWorkConfirmIn,
    session: Session = Depends(get_session),
) -> ApplicationOut:
    app = session.get(VacancyApplication, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    vacancy = session.get(Vacancy, app.vacancy_id)
    jobseeker = session.get(JobSeeker, app.jobseeker_id)
    if vacancy is None or jobseeker is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if vacancy.legal_company_id != payload.legal_company_id:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    if payload.action == "arrival":
        if (app.work_status or "none") != "departed":
            raise HTTPException(status_code=422, detail="Вахтовик ещё не отметил выезд")
        app.arrival_confirmed = True
    elif payload.action == "start":
        if (app.work_status or "none") != "started":
            raise HTTPException(status_code=422, detail="Вахтовик ещё не отметил выход на работу")
        app.start_confirmed = True
    else:
        if (app.work_status or "none") != "finished":
            raise HTTPException(status_code=422, detail="Вахтовик ещё не отметил завершение работы")
        if app.finish_reject_kind == "wont_continue":
            raise HTTPException(status_code=422, detail="Завершение уже отклонено")
        app.finish_confirmed = True
        app.finish_reject_kind = None
        app.finish_reject_reason = None

    session.add(app)
    session.commit()
    session.refresh(app)
    return _to_out(
        app,
        vacancy,
        jobseeker,
        _block_for(session, vacancy.legal_company_id, jobseeker.id),
    )


@router.patch(
    "/{application_id}/finish-reject",
    response_model=ApplicationOut,
    summary="Компания: отказать в завершении работы",
)
def reject_finish(
    application_id: int,
    payload: ApplicationFinishRejectIn,
    session: Session = Depends(get_session),
) -> ApplicationOut:
    app = session.get(VacancyApplication, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    vacancy = session.get(Vacancy, app.vacancy_id)
    jobseeker = session.get(JobSeeker, app.jobseeker_id)
    if vacancy is None or jobseeker is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if vacancy.legal_company_id != payload.legal_company_id:
        raise HTTPException(status_code=404, detail="Отклик не найден")
    if (app.work_status or "none") != "finished":
        raise HTTPException(status_code=422, detail="Вахтовик ещё не отметил завершение работы")
    if app.finish_confirmed:
        raise HTTPException(status_code=422, detail="Завершение уже подтверждено")

    reason = (payload.reason or "").strip()
    if len(reason) < 3:
        raise HTTPException(status_code=422, detail="Укажите причину")

    app.finish_reject_kind = payload.kind
    app.finish_reject_reason = reason
    if payload.kind == "incomplete":
        app.work_status = "started"
        app.finish_confirmed = False
    session.add(app)
    session.commit()
    session.refresh(app)
    return _to_out(
        app,
        vacancy,
        jobseeker,
        _block_for(session, vacancy.legal_company_id, jobseeker.id),
    )

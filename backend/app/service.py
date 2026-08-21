"""Общие функции выборки вакансий по фильтрам.

Используются роутерами vacancies и filters, чтобы логика
фильтрации была в одном месте.
"""

import re
from typing import Optional
from uuid import uuid4

from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.models import City, Company, CompanyJobseekerBlock, Schedule, Vacancy
from app.schemas import VacancyOut
from app.translit import translit_slug

# Транслитерация кириллицы для слагов компаний.
_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(name: str) -> str:
    """Слаг из названия компании («Газпром нефть» → gazprom-neft)."""
    lowered = (name or "").lower().strip()
    out = "".join(_TRANSLIT.get(ch, ch if ch.isalnum() else "-") for ch in lowered)
    return re.sub(r"[^a-z0-9]+", "-", out).strip("-") or "company"

# Опции зарплаты: value, label, min (None — любое), specified_only
SALARY_OPTIONS = (
    ("any", "Любая", None, False),
    ("specified", "Указана зарплата", None, True),
    ("100k", "от 100 000 ₽", 100_000, False),
    ("150k", "от 150 000 ₽", 150_000, False),
    ("200k", "от 200 000 ₽", 200_000, False),
)


def blocked_company_ids(session: Session, jobseeker_id: int) -> list[int]:
    """Организации, которые заблокировали этого вахтовика."""
    rows = session.exec(
        select(CompanyJobseekerBlock.legal_company_id).where(
            CompanyJobseekerBlock.jobseeker_id == jobseeker_id,
            CompanyJobseekerBlock.is_active.is_(True),
        )
    ).all()
    return list(rows)


def is_jobseeker_blocked(session: Session, jobseeker_id: int, legal_company_id: Optional[int]) -> bool:
    if legal_company_id is None:
        return False
    return (
        session.exec(
            select(CompanyJobseekerBlock.id).where(
                CompanyJobseekerBlock.jobseeker_id == jobseeker_id,
                CompanyJobseekerBlock.legal_company_id == legal_company_id,
                CompanyJobseekerBlock.is_active.is_(True),
            )
        ).first()
        is not None
    )


def vacancy_conditions(
    q: Optional[str] = None,
    cities: Optional[list[str]] = None,
    salary_min: Optional[int] = None,
    salary_specified: Optional[bool] = None,
    schedule: Optional[str] = None,
    legal_company_id: Optional[int] = None,
    status: Optional[str] = None,
    hidden_company_ids: Optional[list[int]] = None,
) -> list:
    """SQL-условия для выборки вакансий.

    Каталог: только опубликованные (status = published).
    Страница «Список вакансий» компании (legal_company_id задан):
    вакансии организации — по статусу (или все, если статус не указан).

    Требует, чтобы к запросу были присоединены city, company
    (для текстового поиска по городу и компании) и schedule_ref
    (для поиска/фильтра по графику вахты).
    """
    if legal_company_id is not None:
        # Список компании: вакансии владельца по вкладке (или все).
        conds = [Vacancy.legal_company_id == legal_company_id]
        if status:
            conds.append(Vacancy.status == status)
    else:
        # Каталог: только опубликованные вакансии.
        conds = [Vacancy.status == "published"]

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

    # Скрыть вакансии компаний, которые заблокировали вахтовика.
    if hidden_company_ids:
        conds.append(
            or_(
                Vacancy.legal_company_id.is_(None),
                Vacancy.legal_company_id.notin_(hidden_company_ids),
            )
        )

    return conds


def order_for(sort: str):
    """ORDER BY для вариантов сортировки фронта."""
    if sort == "salary-desc":
        return [Vacancy.salary_from.desc().nullslast()]
    if sort == "salary-asc":
        return [Vacancy.salary_from.asc().nullslast()]
    return [Vacancy.published_at.desc(), Vacancy.id.desc()]


def get_or_create_city(session: Session, name: str) -> City:
    """Возвращает город из справочника, при отсутствии — создаёт."""
    name = (name or "").strip()
    if not name:
        raise ValueError("Укажите город")
    city = session.exec(select(City).where(func.lower(City.name) == name.lower())).first()
    if city is None:
        city = City(name=name)
        session.add(city)
        session.flush()
    return city


def get_or_create_company(session: Session, name: str) -> Company:
    """Возвращает компанию по названию, при отсутствии — создаёт.

    Слаг генерируется транслитерацией; при коллизии добавляется суффикс.
    """
    name = (name or "").strip()
    if not name:
        raise ValueError("Укажите компанию")
    company = session.exec(
        select(Company).where(func.lower(Company.name) == name.lower())
    ).first()
    if company is None:
        slug = slugify(name)
        existing = session.exec(select(Company.id).where(Company.slug == slug)).first()
        if existing is not None:
            slug = f"{slug}-{uuid4().hex[:6]}"
        company = Company(name=name, slug=slug, verified=False)
        session.add(company)
        session.flush()
    return company


def make_full_slug(title_slug: str, company_slug: Optional[str]) -> str:
    """Слаг карточки: транслит названия + '-' + транслит организации.

    Без организации — просто транслит названия. Пример:
    ("mashinist-burovoj-ustanovki", "gazprom-neft")
    → "mashinist-burovoj-ustanovki-gazprom-neft".
    """
    if company_slug:
        return f"{title_slug}-{company_slug}"
    return title_slug


def make_unique_full_slug(session: Session, base: str) -> str:
    """Полный слаг карточки с гарантией уникальности.

    При коллизии (одинаковая должность у разных организаций и похожие
    слаги) добавляется суффикс -2, -3, ….
    """
    slug = base
    n = 2
    while session.exec(
        select(Vacancy.id).where(Vacancy.full_slug == slug)
    ).first() is not None:
        slug = f"{base}-{n}"
        n += 1
    return slug


def to_vacancy_out(v: Vacancy) -> VacancyOut:
    """Собирает плоскую модель ответа из модели БД."""
    return VacancyOut(
        id=v.id,
        title=v.title,
        slug=v.slug or translit_slug(v.title),
        company_slug=v.company.slug if v.company else None,
        full_slug=v.full_slug
        or make_full_slug(
            v.slug or translit_slug(v.title),
            v.company.slug if v.company else None,
        ),
        status=v.status,
        legal_company_id=v.legal_company_id,
        salary_from=v.salary_from,
        salary_to=v.salary_to,
        schedule=v.schedule_ref.value if v.schedule_ref else "",
        description=v.description,
        city=v.city.name if v.city else "",
        company=v.company.name if v.company else "",
        logo=v.company.logo if v.company else None,
        verified=v.company.verified if v.company else False,
        published_at=v.published_at,
        salary_hourly_from=v.salary_hourly_from,
        salary_hourly_to=v.salary_hourly_to,
        hours_per_shift=v.hours_per_shift or [],
        shift_length=v.shift_length or [],
        work_schedule=v.work_schedule or [],
        dorm_address=v.dorm_address,
        dorm_route=v.dorm_route,
        dorm_route_photo=v.dorm_route_photo,
        work_photos=v.work_photos or [],
        dorm_photos=v.dorm_photos or [],
        promos=v.promos or [],
        duties=v.duties,
        living_conditions=v.living_conditions,
        meals=v.meals,
        med_book=v.med_book,
        experience_required=v.experience_required,
        experience_requirements=v.experience_requirements,
        clothing=v.clothing,
        travel_paid=v.travel_paid,
    )

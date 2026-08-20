"""Демо-данные для ручного наполнения БД.

Скрипт НЕ вызывается автоматически при старте приложения (сидирование
отключено — данные добавляются пользователями). Это ручной инструмент
для разработки/демо: наполняет справочники городов/графиков (если их
нет), компании и вакансии.

Запуск в контейнере:
    docker compose exec backend python -m app.seed

Идемпотентно: если в таблице vacancies уже есть записи, ничего не делает.
"""

from datetime import timedelta
from typing import Optional

from sqlmodel import Session, select

from app.db import engine
from app.models import City, Company, Schedule, Vacancy, utcnow

# Компании: (name, slug, logo, verified)
SEED_COMPANIES = [
    ("Газпром нефть", "gazprom-neft", "img/gazprom.svg", True),
    ("Норникель", "nornickel", "img/nornickel.svg", True),
    ("Лукойл", "lukoil", "img/lukoil.svg", True),
    ("СИБУР", "sibur", "img/sibur.svg", True),
    ("ООО «Сибстрой»", "sibstroy", "img/sibstroy.svg", True),
    ("ООО «ТрансСервис»", "transservice", "img/transservice.svg", False),
    ("ООО «Газстрой»", "gazstroy", "img/gazstroy.svg", True),
    ("ООО «АлмазДорСтрой»", "almazdorstroy", "img/almazdorstroy.svg", False),
]

# Вакансии: (title, salary_from, salary_to, city, schedule, company, days_ago, description)
SEED_VACANCIES = [
    ("Машинист буровой установки", 180_000, 220_000, "Новый Уренгой", "30/30", "Газпром нефть", 0,
     "Работа вахтовым методом на буровой площадке. Опыт от 3 лет, наличие удостоверения машиниста."),
    ("Водитель самосвала (кат. АIII)", 180_000, 220_000, "Талнах", "30/30", "Норникель", 0,
     "Работа на карьерных самосвалах, категория АIII, стаж от 2 лет."),
    ("Электрогазосварщик НАКС", 180_000, 220_000, "Пермь", "30/30", "Лукойл", 1,
     "Сварка трубопроводов на объектах нефтегазовой отрасли. Наличие аттестации НАКС обязательно."),
    ("Аппаратчик химического производства", 180_000, 220_000, "Тобольск", "30/30", "СИБУР", 2,
     "Обслуживание технологических установок на производстве полимеров. Работа по сменному графику."),
    ("Машинист экскаватора", 150_000, 180_000, "Красноярск", "45/15", "ООО «Сибстрой»", 0,
     "Работа на экскаваторах 4-5 разряда на строительных объектах. Стаж от 2 лет."),
    ("Водитель самосвала (кат. С)", 120_000, 140_000, "Иркутск", "60/30", "ООО «ТрансСервис»", 3,
     "Перевозка грунта и сыпучих материалов на самосвалах. Категория С, опыт от 1 года."),
    ("Электрогазосварщик", 130_000, 160_000, "Новый Уренгой", "60/30", "ООО «Газстрой»", 5,
     "Сварочные работы на строительстве объектов газовой инфраструктуры."),
    ("Разнорабочий", 70_000, 90_000, "Москва", "15/15", "ООО «АлмазДорСтрой»", 0,
     "Подсобные работы на дорожном строительстве. Без опыта — обучим на месте."),
    ("Слесарь-ремонтник", 100_000, 130_000, "Санкт-Петербург", "30/30", "Газпром нефть", 1,
     "Ремонт и обслуживание оборудования нефтеперерабатывающего завода."),
    ("Монтажник", 90_000, 120_000, "Новосибирск", "15/15", "ООО «ТрансСервис»", 4,
     "Монтаж металлоконструкций и технологического оборудования."),
    ("Крановщик", 160_000, 200_000, "Новый Уренгой", "45/15", "Норникель", 0,
     "Работа на автокранах грузоподъёмностью до 50 т. Наличие удостоверения крановщика."),
    ("Оператор технологических установок", 140_000, 170_000, "Тобольск", "90/60", "СИБУР", 6,
     "Управление технологическими установками пиролиза. Высшее или среднее техническое образование."),
    ("Бурильщик", 200_000, 250_000, "Новый Уренгой", "30/30", "Газпром нефть", 0,
     "Бурение эксплуатационных скважин, опыт работы на буровой от 3 лет."),
]


def _get_or_create_city(session: Session, name: str) -> City:
    city = session.exec(select(City).where(City.name == name)).first()
    if city is None:
        city = City(name=name)
        session.add(city)
        session.flush()
    return city


def _get_or_create_schedule(session: Session, value: str) -> Optional[Schedule]:
    sched = session.exec(select(Schedule).where(Schedule.value == value)).first()
    if sched is None:
        sched = Schedule(value=value, label=value, sort_order=999)
        session.add(sched)
        session.flush()
    return sched


def seed_if_empty() -> int:
    """Наполняет БД демо-данными, если таблица vacancies пуста.

    Возвращает число добавленных вакансий (0 — если данные уже есть).
    """
    with Session(engine) as session:
        if session.exec(select(Vacancy.id).limit(1)).first() is not None:
            print("Вакансии уже есть — сид пропущен.")
            return 0

        # Компании (get-or-create по slug)
        companies: dict[str, Company] = {}
        for name, slug, logo, verified in SEED_COMPANIES:
            company = session.exec(select(Company).where(Company.slug == slug)).first()
            if company is None:
                company = Company(name=name, slug=slug, logo=logo, verified=verified)
                session.add(company)
                session.flush()
            companies[name] = company

        # Вакансии: город и график — из справочников (создаются при отсутствии)
        now = utcnow()
        added = 0
        for title, s_from, s_to, city_name, schedule_value, company_name, days_ago, desc in SEED_VACANCIES:
            city = _get_or_create_city(session, city_name)
            sched = _get_or_create_schedule(session, schedule_value)
            vacancy = Vacancy(
                title=title,
                salary_from=s_from,
                salary_to=s_to,
                city_id=city.id,
                company_id=companies[company_name].id,
                schedule_id=sched.id if sched else None,
                description=desc,
                published_at=now - timedelta(days=days_ago),
            )
            session.add(vacancy)
            added += 1

        session.commit()
        print(f"Добавлено компаний: {len(companies)}, вакансий: {added}.")
        return added


if __name__ == "__main__":
    seed_if_empty()

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
from app.translit import translit_slug

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

# Вакансии: (title, salary_from, salary_to, city, schedule, company, days_ago, description, extras)
# extras — дополнительные поля карточки (см. app/models.py Vacancy).
SEED_VACANCIES = [
    ("Машинист буровой установки", 180_000, 220_000, "Новый Уренгой", "30/30", "Газпром нефть", 0,
     "Работа вахтовым методом на буровой площадке. Опыт от 3 лет, наличие удостоверения машиниста.",
     {
         "hours_per_shift": [11, 12],
         "shift_length": [30, 35],
         "work_schedule": ["1/1", "2/2"],
         "dorm_address": "г. Новый Уренгой, ул. Промысловая, д. 12",
         "dorm_route": "От остановки «Промысловая» — 5 минут пешком. Схема проезда во вкладке «Общежитие».",
         "work_photos": ["img/work-1.svg", "img/work-2.svg", "img/work-3.svg"],
         "dorm_photos": ["img/dorm-1.svg", "img/dorm-2.svg", "img/dorm-3.svg"],
         "promos": [
             {"title": "Приведи друга — получи 5 000 ₽", "text": "Премия за каждого приведённого вахтовика после первой вахты."},
             {"title": "Бонус за вахту 60 дней", "text": "+10 000 ₽ к зарплате при отработке вахты 60 дней без перерыва."},
             {"title": "Бесплатная спецодежда", "text": "Полный комплект спецодежды и средств защиты при трудоустройстве."},
         ],
         "duties": "Управление буровой установкой при выполнении буровых работ\nКонтроль технического состояния оборудования, своевременный ремонт\nСоблюдение техники безопасности и технологических регламентов\nВедение документации по эксплуатации установки",
         "living_conditions": "Бесплатное благоустроенное общежитие (2–3 человека в комнате)\nТрёхразовое питание в столовой за счёт компании\nДушевые, прачечная, комната отдыха, Wi-Fi в общежитии\nДоставка до места работы служебным транспортом",
         "meals": "3",
         "med_book": "help",
         "experience_required": True,
         "experience_requirements": "Опыт работы машинистом буровой от 3 лет, удостоверение машиниста",
         "clothing": "provided",
         "travel_paid": True,
     }),
    ("Водитель самосвала (кат. АIII)", 180_000, 220_000, "Талнах", "30/30", "Норникель", 0,
     "Работа на карьерных самосвалах, категория АIII, стаж от 2 лет.", None),
    ("Электрогазосварщик НАКС", 180_000, 220_000, "Пермь", "30/30", "Лукойл", 1,
     "Сварка трубопроводов на объектах нефтегазовой отрасли. Наличие аттестации НАКС обязательно.", None),
    ("Аппаратчик химического производства", 180_000, 220_000, "Тобольск", "30/30", "СИБУР", 2,
     "Обслуживание технологических установок на производстве полимеров. Работа по сменному графику.", None),
    ("Машинист экскаватора", 150_000, 180_000, "Красноярск", "45/15", "ООО «Сибстрой»", 0,
     "Работа на экскаваторах 4-5 разряда на строительных объектах. Стаж от 2 лет.",
     {
         "hours_per_shift": [11],
         "shift_length": [20, 30],
         "work_schedule": ["2/2", "3/3"],
         "meals": "2",
         "med_book": "yes",
         "experience_required": True,
         "experience_requirements": "Стаж работы на экскаваторе от 2 лет",
         "clothing": "provided",
     }),
    ("Водитель самосвала (кат. С)", 120_000, 140_000, "Иркутск", "60/30", "ООО «ТрансСервис»", 3,
     "Перевозка грунта и сыпучих материалов на самосвалах. Категория С, опыт от 1 года.", None),
    ("Электрогазосварщик", 130_000, 160_000, "Новый Уренгой", "60/30", "ООО «Газстрой»", 5,
     "Сварочные работы на строительстве объектов газовой инфраструктуры.", None),
    ("Разнорабочий", 70_000, 90_000, "Москва", "15/15", "ООО «АлмазДорСтрой»", 0,
     "Подсобные работы на дорожном строительстве. Без опыта — обучим на месте.",
     {
         "hours_per_shift": [8],
         "shift_length": [15],
         "work_schedule": ["5/2"],
         "meals": "1",
         "med_book": "no",
         "experience_required": False,
         "clothing": "provided",
         "travel_paid": False,
     }),
    ("Слесарь-ремонтник", 100_000, 130_000, "Санкт-Петербург", "30/30", "Газпром нефть", 1,
     "Ремонт и обслуживание оборудования нефтеперерабатывающего завода.", None),
    ("Монтажник", 90_000, 120_000, "Новосибирск", "15/15", "ООО «ТрансСервис»", 4,
     "Монтаж металлоконструкций и технологического оборудования.", None),
    ("Крановщик", 160_000, 200_000, "Новый Уренгой", "45/15", "Норникель", 0,
     "Работа на автокранах грузоподъёмностью до 50 т. Наличие удостоверения крановщика.",
     {
         "hours_per_shift": [11, 12],
         "shift_length": [30],
         "work_schedule": ["1/1", "6/1"],
         "meals": "3",
         "med_book": "yes",
         "experience_required": True,
         "experience_requirements": "Наличие удостоверения крановщика, опыт от 2 лет",
         "clothing": "yes",
         "travel_paid": True,
     }),
    ("Оператор технологических установок", 140_000, 170_000, "Тобольск", "90/60", "СИБУР", 6,
     "Управление технологическими установками пиролиза. Высшее или среднее техническое образование.", None),
    ("Бурильщик", 200_000, 250_000, "Новый Уренгой", "30/30", "Газпром нефть", 0,
     "Бурение эксплуатационных скважин, опыт работы на буровой от 3 лет.",
     {
         "hours_per_shift": [11, 12],
         "shift_length": [30, 35],
         "work_schedule": ["1/1", "6/1"],
         "meals": "3",
         "med_book": "help",
         "experience_required": True,
         "experience_requirements": "Опыт работы на буровой от 3 лет",
         "clothing": "provided",
         "travel_paid": True,
     }),
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

        # Вакансии: город и график — из справочников (создаются при отсутствии).
        # slug — транслит названия, дедуплицируется суффиксом -2, -3, …
        taken = set(session.exec(select(Vacancy.slug)).all())
        now = utcnow()
        added = 0
        for title, s_from, s_to, city_name, schedule_value, company_name, days_ago, desc, extras in SEED_VACANCIES:
            city = _get_or_create_city(session, city_name)
            sched = _get_or_create_schedule(session, schedule_value)
            base = translit_slug(title) or f"vacancy-{added + 1}"
            slug = base
            n = 2
            while slug in taken:
                slug = f"{base}-{n}"
                n += 1
            taken.add(slug)
            extra = extras or {}
            vacancy = Vacancy(
                title=title,
                slug=slug,
                salary_from=s_from,
                salary_to=s_to,
                city_id=city.id,
                company_id=companies[company_name].id,
                schedule_id=sched.id if sched else None,
                description=desc,
                published_at=now - timedelta(days=days_ago),
                **{k: v for k, v in extra.items() if hasattr(Vacancy, k)},
            )
            session.add(vacancy)
            added += 1

        session.commit()
        print(f"Добавлено компаний: {len(companies)}, вакансий: {added}.")
        return added


if __name__ == "__main__":
    seed_if_empty()

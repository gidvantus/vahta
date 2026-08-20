# Вахта.ру — каталог вакансий на вахту

Фронтенд (статика) + бэкенд (FastAPI + SQLModel + Alembic + PostgreSQL).
Бэкенд пока не подключён к фронту — API работает независимо.

## Быстрый старт (весь стек из одного файла)

```bash
docker compose up --build
```

| Компонент | URL |
|---|---|
| Фронтенд (nginx) | http://localhost (порт 80, переопределяется через `WEB_PORT`) |
| API (Swagger UI) | http://localhost:8000/docs |
| Healthcheck API | http://localhost:8000/health |

При первом старте Alembic применяет миграции, а приложение наполняет БД
демо-данными (13 вакансий — те же, что в прототипе фронта).

Остановка: `docker compose down` (данные БД сохраняются в volume `pgdata`;
`docker compose down -v` — с полной очисткой).

## Структура

```
frontend/                — фронтенд (статика, nginx)
├── index.html
├── css/, js/, img/      — стили, скрипты, логотипы
└── Dockerfile
backend/                 — бэкенд
├── app/
│   ├── main.py          — FastAPI-приложение (lifespan: сиды)
│   ├── config.py        — настройки из env (.env / compose)
│   ├── db.py            — engine + сессия
│   ├── models.py        — SQLModel: Company, City, Vacancy
│   ├── schemas.py       — Pydantic-схемы ответов
│   ├── service.py       — общая логика фильтрации/сортировки
│   ├── seed.py          — демо-данные (идемпотентно)
│   └── routers/         — vacancies, filters, meta
├── alembic/             — миграции (versions/0001_initial.py)
└── Dockerfile
docker-compose.yml       — весь стек: db + backend + frontend
```

## API

- `GET /api/v1/vacancies` — список с фильтрами:
  `q` (поиск), `cities` (через запятую), `salary_min`, `schedule`
  (`15/15`, `30/30`, `45/15`, `60/30` или `other`), `sort`
  (`date` | `salary-desc` | `salary-asc`), `page`, `page_size`
- `GET /api/v1/vacancies/{id}` — карточка вакансии
- `GET /api/v1/filters` — данные сайдбара фильтров (города/графики/зарплата со счётчиками)
- `GET /api/v1/companies`, `GET /api/v1/cities` — справочники
- `GET /health` — healthcheck

## Миграции (локально, без Docker)

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head       # применяет миграции
uvicorn app.main:app --reload
```

Новая миграция: `alembic revision --autogenerate -m "описание"` — для
автогенерации нужна рабочая БД, подключённая по `DATABASE_URL`.

## Окружение

Параметры PostgreSQL можно переопределить через `.env` (см. `.env.example`):
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

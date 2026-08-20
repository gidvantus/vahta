# Вахта.ру — каталог вакансий на вахту

Фронтенд (Vite + React, сборка в `dist`, раздаёт nginx) + бэкенд
(FastAPI + SQLModel + Alembic + PostgreSQL).
Запросы `/api/*` проксируются nginx на бэкенд, CORS не требуется.

Две страницы:
- `/` — каталог вакансий: список и фильтры загружаются **из базы**
  (`GET /api/v1/vacancies`, `GET /api/v1/filters`);
- `/vacancy/` — карточка вакансии, пока **статическая** (не из базы,
  интеграция с `GET /api/v1/vacancies/{id}` — следующий шаг).

## Быстрый старт (весь стек из одного файла)

```bash
docker compose up --build
```

| Компонент | URL |
|---|---|
| Фронтенд (nginx) | http://localhost (порт 80, переопределяется через `WEB_PORT`) |
| API (Swagger UI) | http://localhost:8000/docs |
| Healthcheck API | http://localhost:8000/health |

При первом старте Alembic применяет миграции и наполняет справочники
(графики вахты `schedule`, базовые города `city`). Вакансии и компании
добавляются пользователями через API.

Остановка: `docker compose down` (данные БД сохраняются в volume `pgdata`;
`docker compose down -v` — с полной очисткой).

## Демо-данные (временно)

Сидирование при старте отключено — данные добавляются пользователями.
Для разработки/демо базу можно наполнить вручную:

```bash
docker compose exec backend python -m app.seed
```

Скрипт идемпотентен: если в `vacancies` уже есть записи, он ничего
не делает. Справочники (города, графики вахты) наполняются миграцией
применяемой при старте контейнера.

## Тесты

Функциональные тесты чистой логики фронтенда (`frontend/src/lib/query.js`,
`frontend/src/lib/format.js`) — обычный Node.js, без фреймворков:

```bash
node test/run-tests.js
```

Запуск из корня репозитория. Тесты не требуют БД и Docker.

## Структура

```
frontend/                — фронтенд (Vite + React)
├── index.html           — точка входа Vite
├── vite.config.js
├── package.json         — npm ci && npm run build
├── src/
│   ├── main.jsx         — рендер приложения (React + Router)
│   ├── App.jsx          — маршруты: / (каталог), /vacancy (карточка)
│   ├── api.js           — слой API: fetch /api/v1/vacancies, /api/v1/filters
│   ├── pages/           — CatalogPage (из БД), VacancyPage (пока статична)
│   ├── components/      — Header, Footer, VacancyCard, FilterSidebar,
│   │                      SortMenu, Carousel, Toast
│   ├── lib/             — query.js (параметры запроса), format.js (форматы)
│   └── css/             — (импорт стилей из css/)
├── css/                 — стили (style.css, vacancy.css)
├── public/img/          — статика: логотипы, фото, схема проезда
├── nginx.conf           — SPA-fallback + прокси /api/ на бэкенд
├── test/ → корень       — тесты лежат в ../test
└── Dockerfile           — multi-stage: node (build) → nginx (dist)
backend/                 — бэкенд
├── app/
│   ├── main.py          — FastAPI-приложение (lifespan: миграции)
│   ├── config.py        — настройки из env (.env / compose)
│   ├── db.py            — engine + сессия
│   ├── models.py        — SQLModel: Company, City, Schedule, Vacancy
│   ├── schemas.py       — Pydantic-схемы ответов
│   ├── service.py       — общая логика фильтрации/сортировки
│   ├── seed.py          — демо-данные (ручной запуск, не автозапуск)
│   └── routers/         — vacancies, filters, meta
├── alembic/             — миграции (versions/0001_initial.py, 0002_schedule_reference.py)
└── Dockerfile
docker-compose.yml       — весь стек: db + backend + frontend
```

## API

- `GET /api/v1/vacancies` — список с фильтрами:
  `q` (поиск), `cities` (через запятую), `salary_min`,
  `salary_specified` (только с указанной зарплатой), `schedule`
  (значение из справочника: `15/15`, `30/30`, `45/15`, `60/30`,
  `90/60` или `other`), `sort` (`date` | `salary-desc` | `salary-asc`),
  `page`, `page_size`
- `GET /api/v1/vacancies/{id}` — карточка вакансии
- `GET /api/v1/filters` — данные сайдбара фильтров: города и графики
  вахты из справочников (`city`, `schedule`) со счётчиками активных
  вакансий, зарплатные диапазоны
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

## Фронтенд (локальная разработка)

```bash
cd frontend
npm ci
npm run dev              # Vite dev-сервер: http://localhost:5173
```

В dev-режиме запросы идут на `/api/v1/*` того же origin
(`frontend/src/api.js`), поэтому для работы с бэкендом нужен прокси
в `vite.config.js` на `http://localhost:8000` — в проде эту роль
выполняет `frontend/nginx.conf`.

## Окружение

Параметры PostgreSQL можно переопределить через `.env` (см. `.env.example`):
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

## Развёртывание на сервере

Продакшен-сервер: `200.165.231.132` (Ubuntu, Docker Engine). Вход по SSH-ключу:

```bash
ssh vahta              # хост описан в ~/.ssh/config (ключ id_ed25519_vahta)
```

Проект лежит на сервере в `/srv/vahta`. Стек поднимается так же, как локально:

```bash
cd /srv/vahta
docker compose up -d --build
```

| Компонент | Адрес на сервере |
|---|---|
| Фронтенд | http://200.165.231.132 (порт 80) |
| API (Swagger UI) | http://200.165.231.132:8000/docs |
| Healthcheck API | http://200.165.231.132:8000/health |

Обновление продакшена: загрузить актуальные файлы в `/srv/vahta`
(например, через `git pull` или SFTP) и пересобрать:

```bash
cd /srv/vahta && docker compose up -d --build
```

При пересборке старый контейнер продолжает работать, пока новый образ
не готов; данные БД сохраняются в volume `vahta_pgdata`.

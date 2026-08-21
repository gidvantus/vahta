# Вахта.ру — каталог вакансий на вахту

Фронтенд (Vite + React, сборка в `dist`, раздаёт nginx) + бэкенд
(FastAPI + SQLModel + Alembic + PostgreSQL).
Запросы `/api/*` проксируются nginx на бэкенд, CORS не требуется.

Две страницы:
- `/` — каталог вакансий: список и фильтры загружаются **из базы**
  (`GET /api/v1/vacancies`, `GET /api/v1/filters`);
- `/vacancy/:id` — карточка вакансии **из базы**
  (`GET /api/v1/vacancies/{id}`);
- `/vacancy/new` — форма **создания вакансии** (кнопка «Разместить
  вакансию» в шапке): предосмотр карточки и публикация через
  `POST /api/v1/vacancies` (+ `POST /api/v1/uploads` для фото).

Также есть отдельные страницы регистрации и личного кабинета:
- `/register-company` — регистрация юридического лица;
- `/login` — вход по телефону и паролю: сервер ищет пользователя
  в базе и сверяет пароль с хешем; при успехе — переадресация
  на `/account`;
- `/account` — личный кабинет: данные пользователя и организации,
  введённые при регистрации (доступен только после авторизации,
  данные берутся из сессии). Кнопка в шапке: «Войти» (`/login`),
  если не авторизован, и «Личный кабинет» (`/account`) — если
  авторизован.

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
применяемой при старте контейнера. Часть вакансий сид наполняет
полными данными карточки (фото, акции, обязанности, условия). Чтобы
пересоздать демо-данные с новыми полями:

```bash
docker compose exec db psql -U vahta -d vahta -c "TRUNCATE vacancy RESTART IDENTITY CASCADE"
docker compose exec backend python -m app.seed
```

## Тесты

Функциональные тесты чистой логики фронтенда (`frontend/src/lib/query.js`,
`frontend/src/lib/format.js`, `frontend/src/lib/auth.js`) — обычный Node.js,
без фреймворков:

```bash
node test/run-tests.js
```

Запуск из корня репозитория. Тесты не требуют БД и Docker.

## Структура

```
frontend/                — фронтенд (Vite + React)
├── index.html           — точка входа Vite
├── vite.config.js       — dev-прокси /api и /uploads на localhost:8000
├── package.json         — npm ci && npm run build
├── src/
│   ├── main.jsx         — рендер приложения (React + Router)
│   ├── App.jsx          — маршруты: / (каталог), /vacancy/:id (карточка),
│   │                      /vacancy/new (создание), /register-company,
│   │                      /login, /account
│   ├── api.js           — слой API: vacancies, filters, uploads, справочники
│   ├── api/auth.js      — отдельный слой API авторизации (вход по телефону/паролю)
│   ├── pages/           — CatalogPage (из БД), VacancyPage (по id из адреса),
│   │                      CreateVacancyPage (форма создания),
│   │                      LegalRegistrationPage, LoginPage, AccountPage
│   ├── components/      — Header (кнопка «Войти»/«Личный кабинет» по сессии),
│   │                      Footer, VacancyCard, FilterSidebar,
│   │                      SortMenu, Carousel, Toast, VacancyView, PreviewModal
│   ├── lib/             — query.js (параметры запроса), format.js (форматы),
│   │                      legal.js (валидация регистрации), auth.js (сессия)
│   └── css/             — (импорт стилей из css/)
├── css/                 — стили (style.css, vacancy.css, create.css,
│                          legal-registration.css, login.css, account.css)
├── public/img/          — статика: логотипы, фото, схема проезда
├── nginx.conf           — SPA-fallback + прокси /api/ и /uploads/ на бэкенд
├── test/ → корень       — тесты лежат в ../test
└── Dockerfile           — multi-stage: node (build) → nginx (dist)
backend/                 — бэкенд
├── app/
│   ├── main.py          — FastAPI-приложение (lifespan: миграции)
│   ├── config.py        — настройки из env (.env / compose)
│   ├── db.py            — engine + сессия
│   ├── models.py        — SQLModel: Company, City, Schedule, Vacancy
│   ├── schemas.py       — Pydantic-схемы ответов и создания
│   ├── service.py       — общая логика фильтрации/сортировки
│   ├── auth.py          — отдельная логика авторизации (поиск по телефону,
│   │                      сверка пароля с хешем)
│   ├── translit.py      — транслитерация названий в slug (/vacancy/<slug>)
│   ├── seed.py          — демо-данные (ручной запуск, не автозапуск)
│   └── routers/         — vacancies (list/get/create), filters, meta,
│                          legal_registration, auth,
│                          uploads (загрузка фото в /app/uploads)
├── alembic/             — миграции (0001_initial, 0002_schedule_reference,
│                          0003_vacancy_slug, 0004_legal_registration,
│                          0005_registrant_password_hash, …)
└── Dockerfile
docker-compose.yml       — весь стек: db + backend + frontend
```

## API

- `GET /api/v1/vacancies` — список с фильтрами:
  `q` (поиск), `cities` (через запятую), `salary_min`,
  `salary_specified` (только с указанной зарплатой), `schedule`
  (значение из справочника: `15/15`, `30/30`, `45/15`, `60/30`,
  `90/60` или `other`), `sort` (`date` | `salary-desc` | `salary-asc`),
  `page`, `page_size`. Каждая вакансия содержит `slug` — транслит
  названия для уникального адреса карточки.
- `GET /api/v1/vacancies/slug/{slug}` — карточка вакансии по slug
  (например `/api/v1/vacancies/slug/mashinist-burovoi-ustanovki`)
- `GET /api/v1/vacancies/{id}` — карточка вакансии (включая поля формы
  создания: зарплата в час, часы в смену, продолжительность вахты,
  график работы, общежитие и схема проезда, фото, акции, обязанности,
  условия, питание, медкнижка, опыт, спецодежда, оплата проезда)
- `POST /api/v1/vacancies` — создание вакансии (JSON-форма, город
  и компания по названию, при отсутствии создаются)
- `POST /api/v1/uploads` — загрузка фото (multipart, поле `files`,
  до 7 файлов, до 8 МБ каждый; файлы раздаются с `/uploads/*`)
- `GET /api/v1/filters` — данные сайдбара фильтров: города и графики
  вахты из справочников (`city`, `schedule`) со счётчиками активных
  вакансий, зарплатные диапазоны
- `GET /api/v1/companies`, `GET /api/v1/cities` — справочники
- `GET /api/v1/legal-registration/latest` — данные последней
  регистрации для личного кабинета: регистратор (ФИО, телефон,
  согласие, дата) и его организации (название, ИНН, дата). Пароль
  и его хеш в ответ не включаются. 404 — регистраций пока нет.
- `POST /api/v1/auth/login` — авторизация по телефону и паролю
  (отдельный модуль `app/auth.py`, роутер `routers/auth.py`).
  Ищет регистратора по телефону, сверяет пароль с хешем; при успехе
  возвращает данные личного кабинета (те же, что указаны при
  регистрации). Ошибки: 401 — пользователь не найден / неверный
  пароль, 422 — телефон не в формате.
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

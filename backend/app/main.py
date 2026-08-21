"""Вахта.ру API — FastAPI-приложение.

Запуск: uvicorn app.main:app --host 0.0.0.0 --port 8000
Документация: /docs (Swagger UI), /redoc
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, filters, legal_registration, meta, uploads, vacancies

# Каталог загруженных фото (тот же, что использует роутер uploads).
# Создаётся до монтирования StaticFiles — каталог должен существовать.
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Таблицы создаются миграцией alembic upgrade head из entrypoint
    # контейнера. Данные добавляются пользователями через API.
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API каталога вакансий «Вахта.ру». Интерактивная документация: /docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vacancies.router)
app.include_router(filters.router)
app.include_router(meta.router)
app.include_router(legal_registration.router)
app.include_router(auth.router)
app.include_router(uploads.router)

# Загруженные фото раздаются напрямую: /uploads/<file>
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/", include_in_schema=False, tags=["system"])
def root() -> dict:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}

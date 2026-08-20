"""Вахта.ру API — FastAPI-приложение.

Запуск: uvicorn app.main:app --host 0.0.0.0 --port 8000
Документация: /docs (Swagger UI), /redoc
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import filters, meta, vacancies


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Таблицы создаются миграцией alembic upgrade head из entrypoint
    # контейнера. Данные добавляются пользователями через API.
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

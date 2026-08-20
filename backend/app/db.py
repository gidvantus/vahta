"""Подключение к PostgreSQL: engine и FastAPI-зависимость сессии."""

from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.debug,
)


def get_session() -> Generator[Session, None, None]:
    """Зависимость FastAPI: одна сессия БД на запрос."""
    with Session(engine) as session:
        yield session

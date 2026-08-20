"""Конфигурация приложения.

Все значения читаются из переменных окружения (в docker-compose.yml
они передаются сервису backend) либо из файла .env в рабочей директории.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Вахта.ру API"
    app_version: str = "0.1.0"

    # Драйвер psycopg (v3) — совместим с SQLAlchemy 2.x / SQLModel.
    # Значение по умолчанию подходит для локального запуска вне Docker;
    # в compose передаётся DATABASE_URL с хостом `db`.
    database_url: str = "postgresql+psycopg://vahta:vahta@localhost:5432/vahta"

    # Включает echo SQL-запросов в лог (для отладки).
    debug: bool = False

    # Разрешённые источники для CORS, через запятую ("*" — любые).
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

"""Авторизация пользователей — отдельный роутер.

POST /api/v1/auth/login — вход по телефону и паролю. Логика поиска
пользователя и сверки пароля вынесена в app/auth.py: роутер только
принимает запрос и возвращает данные личного кабинета при успехе.
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import authenticate
from app.db import get_session
from app.schemas import LegalAccountOut, LoginIn

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LegalAccountOut,
    summary="Вход по телефону и паролю",
)
def login(
    payload: LoginIn,
    session: Session = Depends(get_session),
) -> LegalAccountOut:
    """Авторизует пользователя и возвращает данные личного кабинета.

    При успехе — те же данные, что пользователь указал при
    регистрации (регистратор + его организации). При ошибке — 401
    (пользователь не найден / неверный пароль) или 422 (телефон
    не в формате).
    """
    return authenticate(payload.phone, payload.password, session)

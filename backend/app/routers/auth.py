"""Авторизация пользователей — отдельный роутер.

POST /api/v1/auth/login — вход по телефону и паролю. Логика поиска
пользователя и сверки пароля вынесена в app/auth.py: роутер только
принимает запрос и возвращает данные личного кабинета при успехе.

Поддерживаются два типа аккаунтов (user_type): legal — регистратор
юридического лица, jobseeker — физическое лицо («Регистрация для
поиска работы»). У каждого типа свой личный кабинет.
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import authenticate, change_user_password
from app.db import get_session
from app.schemas import AccountOut, ChangePasswordIn, LoginIn

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=AccountOut,
    summary="Вход по телефону и паролю",
)
def login(
    payload: LoginIn,
    session: Session = Depends(get_session),
) -> AccountOut:
    """Авторизует пользователя и возвращает данные личного кабинета.

    При успехе — те же данные, что пользователь указал при
    регистрации (регистратор + его организации для legal; данные
    физического лица для jobseeker). При ошибке — 401 (пользователь
    не найден / неверный пароль) или 422 (телефон не в формате).
    """
    return authenticate(payload.phone, payload.password, session, payload.user_type)


@router.post(
    "/change-password",
    summary="Смена пароля (личный кабинет)",
)
def change_password(
    payload: ChangePasswordIn,
    session: Session = Depends(get_session),
) -> dict:
    """Меняет пароль авторизованного пользователя.

    В модальном окне кабинета только два поля — новый пароль и его
    повторение (текущий пароль не требуется). Сессия после смены
    не сбрасывается: пользователь остаётся в кабинете. В базе
    сохраняется только хеш (app/security.py).
    """
    change_user_password(payload, session)
    return {"message": "Пароль изменён"}

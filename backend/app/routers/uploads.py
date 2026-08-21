"""Загрузка фото вакансий (место работы, проживание).

Файлы сохраняются в каталог uploads/ рядом с приложением и раздаются
через FastAPI StaticFiles по адресу /uploads/* (nginx проксирует).
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import UploadsOut

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

# Каталог загрузок: <проект>/uploads (рядом с backend/app).
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_FILES = 7
MAX_FILE_BYTES = 8 * 1024 * 1024  # 8 МБ


@router.post("", response_model=UploadsOut, summary="Загрузить фото (до 7 за раз)")
async def upload_photos(files: list[UploadFile] = File(...)) -> UploadsOut:
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=422, detail=f"Не более {MAX_FILES} фото за раз")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []
    for f in files:
        ext = Path(f.filename or "").suffix.lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(
                status_code=422,
                detail=f"Недопустимый формат файла: {f.filename or '(без имени)'}",
            )
        data = await f.read()
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(
                status_code=422,
                detail=f"Файл слишком большой (макс. {MAX_FILE_BYTES // (1024 * 1024)} МБ): {f.filename}",
            )
        name = f"{uuid.uuid4().hex}{ext}"
        (UPLOAD_DIR / name).write_bytes(data)
        paths.append(f"uploads/{name}")

    return UploadsOut(paths=paths)

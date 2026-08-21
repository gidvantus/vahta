"""Pydantic-схемы ответов API (модели чтения) и входные схемы создания."""

from datetime import datetime
from typing import Optional

from pydantic import field_validator, model_validator
from sqlmodel import SQLModel


class VacancyOut(SQLModel):
    """Вакансия в плоском виде — готово для карточки на фронте."""

    id: int
    title: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    schedule: str
    description: Optional[str] = None
    city: str
    company: str
    logo: Optional[str] = None
    verified: bool = False
    published_at: datetime

    # Поля карточки (форма создания)
    salary_hourly_from: Optional[int] = None
    salary_hourly_to: Optional[int] = None
    hours_per_shift: list[int] = []
    shift_length: list[int] = []
    work_schedule: list[str] = []
    dorm_address: Optional[str] = None
    dorm_route: Optional[str] = None
    dorm_route_photo: Optional[str] = None
    work_photos: list[str] = []
    dorm_photos: list[str] = []
    promos: list[dict] = []
    duties: Optional[str] = None
    living_conditions: Optional[str] = None
    meals: Optional[str] = None
    med_book: Optional[str] = None
    experience_required: Optional[bool] = None
    experience_requirements: Optional[str] = None
    clothing: Optional[str] = None
    travel_paid: Optional[bool] = None


class VacancyListOut(SQLModel):
    items: list[VacancyOut]
    total: int
    page: int
    page_size: int


class PromoItem(SQLModel):
    """Акция клиента: заголовок + описание."""

    title: str = ""
    text: str = ""


class VacancyCreate(SQLModel):
    """Входные данные формы создания вакансии."""

    title: str = ""
    company: Optional[str] = None
    city: str = ""
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    salary_hourly_from: Optional[int] = None
    salary_hourly_to: Optional[int] = None
    hours_per_shift: list[int] = []
    shift_length: list[int] = []
    work_schedule: list[str] = []
    description: Optional[str] = None
    dorm_address: Optional[str] = None
    dorm_route: Optional[str] = None
    dorm_route_photo: Optional[str] = None
    work_photos: list[str] = []
    dorm_photos: list[str] = []
    promos: list[PromoItem] = []
    duties: Optional[str] = None
    living_conditions: Optional[str] = None
    meals: Optional[str] = None
    med_book: Optional[str] = None
    experience_required: Optional[bool] = None
    experience_requirements: Optional[str] = None
    clothing: Optional[str] = None
    travel_paid: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def title_max_three_words(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Укажите название вакансии")
        if len(v.split()) > 3:
            raise ValueError("Название вакансии — не более 3 слов")
        return v

    @field_validator("work_photos", "dorm_photos")
    @classmethod
    def photos_max_seven(cls, v: list[str]) -> list[str]:
        if len(v) > 7:
            raise ValueError("Не более 7 фото")
        return v

    @model_validator(mode="after")
    def salary_ranges_ok(self) -> "VacancyCreate":
        for field_from, field_to, label in (
            ("salary_from", "salary_to", "Месячная зарплата"),
            ("salary_hourly_from", "salary_hourly_to", "Зарплата в час"),
        ):
            frm, to = getattr(self, field_from), getattr(self, field_to)
            if frm is not None and to is not None and frm > to:
                raise ValueError(f"{label}: «до» не может быть меньше «от»")
        if (
            self.salary_from is None
            and self.salary_to is None
            and self.salary_hourly_from is None
            and self.salary_hourly_to is None
        ):
            raise ValueError("Укажите зарплату (в месяц или в час)")
        return self


class UploadsOut(SQLModel):
    """Результат загрузки файлов: сохранённые пути."""

    paths: list[str]


class CityCount(SQLModel):
    name: str
    count: int
    is_main: bool = False


class ScheduleCount(SQLModel):
    value: str
    label: str
    count: int


class SalaryCount(SQLModel):
    value: str
    label: str
    min: Optional[int] = None
    count: int


class FiltersOut(SQLModel):
    """Данные для сайдбара фильтров (как на фронте)."""

    cities: list[CityCount]
    schedules: list[ScheduleCount]
    salary: list[SalaryCount]


class CompanyOut(SQLModel):
    id: int
    name: str
    slug: str
    logo: Optional[str] = None
    verified: bool
    vacancies_count: int = 0

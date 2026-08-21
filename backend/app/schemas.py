"""Pydantic-схемы ответов API (модели чтения) и входные схемы создания."""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import field_validator, model_validator
from sqlmodel import Field, SQLModel


class VacancyOut(SQLModel):
    """Вакансия в плоском виде — готово для карточки на фронте."""

    id: int
    title: str
    slug: str
    # Транслит организации (часть полного слага карточки).
    company_slug: Optional[str] = None
    # Полный слаг карточки: транслит названия + '-' + транслит организации.
    # По нему открывается карточка: /vacancy/<full_slug>.
    full_slug: str = ""
    # Статус: draft | published | archived.
    status: str = "published"
    # Организация-владелец из личного кабинета (если задана).
    legal_company_id: Optional[int] = None
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
    # Организация-владелец из личного кабинета (для страницы «Список вакансий»).
    legal_company_id: Optional[int] = None
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


class VacancyStatusIn(SQLModel):
    """Новый статус вакансии (вкладки «Списка вакансий» компании)."""

    status: str = "draft"


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


class LoginIn(SQLModel):
    """Входные данные авторизации: телефон и пароль.

    user_type — тип аккаунта: jobseeker (физическое лицо, «Регистрация
    для поиска работы») или legal (юридическое лицо). Телефон
    приводится к каноническому виду +7XXXXXXXXXX и ищется в таблице
    соответствующего типа. Пароль сверяется с хешем в базе
    (app/security.py); ни он сам, ни его хеш в ответ не попадают.
    """

    user_type: Literal["jobseeker", "legal"] = "legal"
    phone: str = Field(max_length=32)
    password: str = Field(max_length=128)


class ChangePasswordIn(SQLModel):
    """Входные данные смены пароля (личный кабинет, модальное окно).

    Пользователь уже авторизован — определяется по типу аккаунта
    (user_type) и телефону; текущий пароль не требуется. Сессия после
    смены пароля не сбрасывается. Новый пароль проходит ту же проверку,
    что при регистрации; в базу попадает только его хеш (app/security.py).
    """

    user_type: Literal["jobseeker", "legal"] = "legal"
    phone: str = Field(max_length=32)
    password: str = Field(max_length=128)
    password_confirm: str = Field(max_length=128)


class JobSeekerRegistrationIn(SQLModel):
    """Входные данные формы «Регистрация для поиска работы» (физлицо).

    Телефон — уникальный ключ: при совпадении с уже зарегистрированным
    значением регистрация отклоняется (409). Пароль передаётся только
    на время запроса: в базе сохраняется его хеш, а не он сам.
    consent должен быть True — согласие на обработку персональных
    данных (обязательное условие регистрации).
    """

    full_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(max_length=32)
    password: str = Field(max_length=128)
    password_confirm: str = Field(max_length=128)
    consent: bool = False


class LegalRegistrationIn(SQLModel):
    """Входные данные формы регистрации юридического лица.

    Телефон и ИНН — уникальные ключи: при совпадении с уже
    зарегистрированными значениями регистрация отклоняется (409).
    Все поля обязательны, consent должен быть True. Пароль передаётся
    только на время запроса: в базе сохраняется его хеш, а не он сам.
    """

    full_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(max_length=32)
    inn: str = Field(min_length=10, max_length=10)
    company_name: str = Field(min_length=2, max_length=200)
    # Длина и состав проверяются в роутере (со своими сообщениями об ошибке).
    password: str = Field(max_length=128)
    password_confirm: str = Field(max_length=128)
    consent: bool = False


class JobSeekerUpdateIn(SQLModel):
    """Редактирование данных соискателя (личный кабинет).

    Согласие на обработку персональных данных (consent) не входит
    в схему — оно не редактируется. Телефон — уникальный ключ,
    также не меняется (передаётся как есть). Обязательные поля
    профиля: date_of_birth (в формате ДД.ММ.ГГГГ), age, gender,
    passport, citizenship. medical_book — необязательное (Да/Нет).
    """

    full_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(max_length=32)
    date_of_birth: str = Field(max_length=10)
    age: int = Field(ge=0, le=130)
    gender: str = Field(max_length=16)
    passport: str = Field(min_length=1, max_length=30)
    citizenship: str = Field(min_length=1, max_length=64)
    medical_book: Optional[str] = Field(default=None, max_length=16)


class LegalRegistrantUpdateIn(SQLModel):
    """Редактирование данных регистратора юридического лица.

    Согласие на обработку персональных данных (consent) не входит
    в схему — оно не редактируется. Телефон — уникальный ключ.
    """

    full_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(max_length=32)


class LegalCompanyUpdateIn(SQLModel):
    """Редактирование данных организации (личный кабинет).

    ИНН — уникальный ключ: при совпадении с уже зарегистрированным
    значением изменение отклоняется (409).
    """

    name: str = Field(min_length=2, max_length=200)
    inn: str = Field(min_length=10, max_length=10)


class LegalRegistrationOut(SQLModel):
    """Результат успешной регистрации юридического лица."""

    id: int
    full_name: str
    phone: str
    inn: str
    company_name: str
    created_at: datetime


class LegalRegistrantOut(SQLModel):
    """Данные регистратора для личного кабинета.

    Пароль и его хеш (password_hash) никогда не включаются в ответ.
    """

    id: int
    full_name: str
    phone: str
    consent: bool
    created_at: datetime


class LegalCompanyOut(SQLModel):
    """Данные организации для личного кабинета."""

    id: int
    inn: str
    name: str
    created_at: datetime


class JobSeekerOut(SQLModel):
    """Данные соискателя (физлицо) для личного кабинета.

    Пароль и его хеш (password_hash) никогда не включаются в ответ.
    """

    id: int
    full_name: str
    phone: str
    consent: bool
    created_at: datetime

    # Поля профиля (личный кабинет).
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    passport: Optional[str] = None
    citizenship: Optional[str] = None
    medical_book: Optional[str] = None


class AccountOut(SQLModel):
    """Данные личного кабинета в зависимости от типа аккаунта.

    user_type=legal — заполнены registrant и companies
    (регистратор юридического лица и его организации);
    user_type=jobseeker — заполнен jobseeker (физическое лицо,
    «Регистрация для поиска работы»). Заполнена только одна ветка.
    """

    user_type: Literal["jobseeker", "legal"]
    registrant: Optional[LegalRegistrantOut] = None
    companies: list[LegalCompanyOut] = []
    jobseeker: Optional[JobSeekerOut] = None

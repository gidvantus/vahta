import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PreviewModal from '../components/PreviewModal';
import { createVacancy, fetchCities, uploadPhotos } from '../api.js';
import { loadSession } from '../lib/auth.js';
import { countWords } from '../lib/format.js';
import { showToast } from '../lib/toast.js';
import '../../css/vacancy.css';

const MAX_PHOTOS = 7;
const MAX_TITLE_WORDS = 3;

const SHIFT_LENGTHS = [15, 20, 30, 35];
const WORK_SCHEDULES = ['1/1', '2/2', '3/3', '5/2', '6/1'];
const HOURS_PER_SHIFT = [8, 9, 11, 12, 24];

const MEALS_OPTIONS = [
  { value: 'no', label: 'Нет' },
  { value: '1', label: 'Да, 1-разовое' },
  { value: '2', label: 'Да, 2-разовое' },
  { value: '3', label: 'Да, 3-разовое' },
];
const MED_BOOK_OPTIONS = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
  { value: 'help', label: 'Да — помогаем сделать' },
];
const YES_NO_OPTIONS = [
  { value: true, label: 'Да' },
  { value: false, label: 'Нет' },
];
const EXPERIENCE_OPTIONS = YES_NO_OPTIONS;
const TRAVEL_OPTIONS = YES_NO_OPTIONS;
const CLOTHING_OPTIONS = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
  { value: 'provided', label: 'Да, предоставляем' },
];

const EMPTY_FORM = {
  title: '',
  city: '',
  salary_from: '',
  salary_to: '',
  salary_hourly_from: '',
  salary_hourly_to: '',
  shift_length: [],
  work_schedule: [],
  hours_per_shift: [],
  description: '',
  duties: '',
  living_conditions: '',
  dorm_address: '',
  dorm_route: '',
  dorm_route_photo: null, // { file, url } — файл схемы проезда
  work_photos: [], // { file, url }
  dorm_photos: [],
  promos: [{ title: '', text: '' }],
  meals: '',
  med_book: '',
  experience_required: null,
  experience_requirements: '',
  clothing: '',
  travel_paid: null,
};

const toInt = (s) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

/* Поле формы: подпись + контрол + подсказка. */
function Field({ label, required, hint, children }) {
  return (
    <div className="form-field">
      <span className="form-field__label">
        {label}
        {required && <span className="form-field__req" aria-hidden="true">*</span>}
      </span>
      {children}
      {hint && <span className="form-field__hint">{hint}</span>}
    </div>
  );
}

/* Группа чипов-вариантов. multi — мультивыбор (несколько активных). */
function ChoiceChips({ options, value, onChange, ariaLabel, multi = false }) {
  const isActive = (opt) => (multi ? Array.isArray(value) && value.includes(opt.value) : value === opt.value);

  function toggle(opt) {
    if (!multi) {
      onChange(isActive(opt) ? null : opt.value);
      return;
    }
    const arr = Array.isArray(value) ? value : [];
    onChange(isActive(opt) ? arr.filter((v) => v !== opt.value) : [...arr, opt.value]);
  }

  return (
    <div className="chips-group" role={multi ? 'group' : 'radiogroup'} aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={active ? 'chip-option is-active' : 'chip-option'}
            aria-pressed={active}
            onClick={() => toggle(opt)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* Прикрепление фото: превью, удаление, лимит. */
function PhotoPicker({ title, photos, onChange, limit = MAX_PHOTOS }) {
  const inputRef = useRef(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const room = limit - photos.length;
    if (files.length > room) {
      showToast(`Можно добавить ещё ${room} фото (максимум ${limit})`);
    }
    const next = files
      .slice(0, Math.max(0, room))
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length) onChange([...photos, ...next]);
    e.target.value = '';
  }

  function remove(i) {
    URL.revokeObjectURL(photos[i].url);
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div className="photo-picker">
      <div className="photo-picker__head">
        <b>{title}</b>
        <span className="photo-picker__count">{photos.length}/{limit}</span>
      </div>
      <div className="photo-picker__grid">
        {photos.map((p, i) => (
          <div className="photo-picker__item" key={p.url}>
            <img src={p.url} alt={`${title} ${i + 1}`} />
            <button type="button" className="photo-picker__remove" onClick={() => remove(i)} aria-label="Удалить фото">✕</button>
          </div>
        ))}
        {photos.length < limit && (
          <button type="button" className="photo-picker__add" onClick={() => inputRef.current?.click()}>
            <span className="photo-picker__plus">+</span>
            Добавить фото
          </button>
        )}
      </div>
      <input ref={inputRef} className="hidden" type="file" accept="image/*" multiple onChange={handleFiles} />
    </div>
  );
}

export default function CreateVacancyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [cities, setCities] = useState([]);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Компания подтягивается из профиля (личного кабинета) — вакансия
  // публикуется от имени организации, зарегистрированной в аккаунте.
  const [session] = useState(() => loadSession());
  const company = session?.companies?.[0] || null;
  const companyName = company?.name || '';
  const legalCompanyId = company?.id || null;

  const words = countWords(form.title);
  const titleOver = words > MAX_TITLE_WORDS;

  useEffect(() => {
    document.title = 'Разместить вакансию — Вахта.ру';
    fetchCities().then(setCities).catch(() => setCities([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* Валидация формы: список ошибок (первая показывается в тосте). */
  function validate() {
    const errs = [];
    if (!form.title.trim()) errs.push('Укажите название вакансии');
    else if (words > MAX_TITLE_WORDS) errs.push('Название вакансии — не более 3 слов');
    if (!form.city.trim()) errs.push('Укажите город');
    if (!form.description.trim()) errs.push('Добавьте описание вакансии');

    const mFrom = toInt(form.salary_from);
    const mTo = toInt(form.salary_to);
    const hFrom = toInt(form.salary_hourly_from);
    const hTo = toInt(form.salary_hourly_to);
    if (mFrom == null && mTo == null && hFrom == null && hTo == null) {
      errs.push('Укажите зарплату (в месяц или в час)');
    }
    if (mFrom != null && mTo != null && mFrom > mTo) errs.push('Зарплата в месяц: «до» не может быть меньше «от»');
    if (hFrom != null && hTo != null && hFrom > hTo) errs.push('Зарплата в час: «до» не может быть меньше «от»');

    if (!form.shift_length.length) errs.push('Выберите хотя бы одну продолжительность вахты');
    if (!form.work_schedule.length) errs.push('Выберите хотя бы один график работы');
    if (!form.hours_per_shift.length) errs.push('Выберите хотя бы одно количество рабочих часов');
    if (!form.meals) errs.push('Укажите питание');
    if (!form.med_book) errs.push('Укажите медицинскую книжку');
    if (form.experience_required == null) errs.push('Укажите, требуется ли опыт работы');
    if (form.experience_required && !form.experience_requirements.trim()) {
      errs.push('Опишите требования к опыту работы');
    }
    if (!form.clothing) errs.push('Укажите спецодежду');
    if (form.travel_paid == null) errs.push('Укажите, оплачивается ли проезд');
    return errs;
  }

  /* Вакансия для предосмотра (из текущих данных формы). */
  function buildPreview() {
    const promos = form.promos
      .filter((p) => p.title.trim() || p.text.trim())
      .map((p) => ({ title: p.title.trim(), text: p.text.trim() }));
    return {
      id: null,
      title: form.title.trim() || 'Название вакансии',
      company: companyName,
      salary_from: toInt(form.salary_from),
      salary_to: toInt(form.salary_to),
      salary_hourly_from: toInt(form.salary_hourly_from),
      salary_hourly_to: toInt(form.salary_hourly_to),
      schedule: '',
      shift_length: form.shift_length,
      work_schedule: form.work_schedule,
      hours_per_shift: form.hours_per_shift,
      description: form.description.trim(),
      city: form.city.trim(),
      logo: null,
      verified: false,
      published_at: new Date().toISOString(),
      work_photos: form.work_photos.map((p) => p.url),
      dorm_photos: form.dorm_photos.map((p) => p.url),
      promos,
      duties: form.duties.trim(),
      living_conditions: form.living_conditions.trim(),
      dorm_address: form.dorm_address.trim(),
      dorm_route: form.dorm_route.trim(),
      dorm_route_photo: form.dorm_route_photo ? form.dorm_route_photo.url : null,
      meals: form.meals,
      med_book: form.med_book,
      experience_required: form.experience_required,
      experience_requirements: form.experience_requirements.trim(),
      clothing: form.clothing,
      travel_paid: form.travel_paid,
    };
  }

  async function handlePublish() {
    const errs = validate();
    if (errs.length) {
      showToast(errs[0]);
      return;
    }
    setSubmitting(true);
    try {
      const workPaths = form.work_photos.length ? (await uploadPhotos(form.work_photos.map((p) => p.file))).paths : [];
      const dormPaths = form.dorm_photos.length ? (await uploadPhotos(form.dorm_photos.map((p) => p.file))).paths : [];
      const routePhoto = form.dorm_route_photo ? (await uploadPhotos([form.dorm_route_photo.file])).paths[0] : null;

      const promos = form.promos
        .filter((p) => p.title.trim() || p.text.trim())
        .map((p) => ({ title: p.title.trim(), text: p.text.trim() }));

      const payload = {
        title: form.title.trim(),
        company: companyName || null,
        legal_company_id: legalCompanyId,
        city: form.city.trim(),
        salary_from: toInt(form.salary_from),
        salary_to: toInt(form.salary_to),
        salary_hourly_from: toInt(form.salary_hourly_from),
        salary_hourly_to: toInt(form.salary_hourly_to),
        shift_length: form.shift_length,
        work_schedule: form.work_schedule,
        hours_per_shift: form.hours_per_shift,
        description: form.description.trim() || null,
        dorm_address: form.dorm_address.trim() || null,
        dorm_route: form.dorm_route.trim() || null,
        dorm_route_photo: routePhoto,
        work_photos: workPaths,
        dorm_photos: dormPaths,
        promos,
        duties: form.duties.trim() || null,
        living_conditions: form.living_conditions.trim() || null,
        meals: form.meals || null,
        med_book: form.med_book || null,
        experience_required: form.experience_required,
        experience_requirements: form.experience_required ? form.experience_requirements.trim() || null : null,
        clothing: form.clothing || null,
        travel_paid: form.travel_paid,
      };

      const created = await createVacancy(payload);
      showToast(`Вакансия «${created.title}» опубликована!`);
      navigate(`/vacancy/${created.full_slug || created.id}`);
    } catch (e) {
      const msg = /failed to fetch|networkerror|load failed/i.test(e.message || '')
        ? 'Сервер недоступен — проверьте соединение и попробуйте ещё раз.'
        : (e.message || 'Не удалось опубликовать вакансию');
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }

  return (
    <>
      <Header />

      <main className="create-page container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span className="sep">/</span>
          <a href="/">Каталог вакансий</a>
          <span className="sep">/</span>
          <span className="current">Разместить вакансию</span>
        </nav>

        <div className="create-head">
          <h1>Разместить вакансию</h1>
          <p>Заполните форму — карточка вакансии соберётся автоматически. Поля со звёздочкой обязательны.</p>
        </div>

        {/* Компания: название подтягивается из профиля (личного кабинета).
            Вакансия публикуется от имени этой организации. Если в аккаунте
            компаний нет — блок не показывается, вакансия создаётся без неё. */}
        {companyName && (
          <div className="create-company">
            <span className="create-company__logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>
            </span>
            <div className="create-company__info">
              <span className="create-company__label">Компания</span>
              <b className="create-company__name">{companyName}</b>
              <span className="create-company__hint">
                Вакансия будет опубликована от имени этой компании.
              </span>
            </div>
          </div>
        )}

        <form className="create-form" onSubmit={(e) => { e.preventDefault(); handlePublish(); }}>
          {/* 1) Основное */}
          <section className="create-section">
            <h2 className="create-section__title">Основное</h2>
            <Field label="Название вакансии" required hint={titleOver ? 'Не более 3 слов' : `${words}/${MAX_TITLE_WORDS} слов`}>
              <input
                className={titleOver ? 'form-input is-error' : 'form-input'}
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Например: Машинист буровой установки"
                maxLength={60}
              />
            </Field>
            <Field label="Город" required>
              <input className="form-input" type="text" list="cities-list" value={form.city} onChange={set('city')} placeholder="Где будет размещена вакансия" />
              <datalist id="cities-list">
                {cities.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
          </section>

          {/* 2) Зарплата */}
          <section className="create-section">
            <h2 className="create-section__title">Зарплата</h2>
            <div className="form-row">
              <Field label="В месяц, от (₽)">
                <input className="form-input" type="number" min="0" step="1000" value={form.salary_from} onChange={set('salary_from')} placeholder="180 000" />
              </Field>
              <Field label="В месяц, до (₽)">
                <input className="form-input" type="number" min="0" step="1000" value={form.salary_to} onChange={set('salary_to')} placeholder="220 000" />
              </Field>
            </div>
            <div className="form-row">
              <Field label="В час, от (₽)">
                <input className="form-input" type="number" min="0" step="10" value={form.salary_hourly_from} onChange={set('salary_hourly_from')} placeholder="900" />
              </Field>
              <Field label="В час, до (₽)">
                <input className="form-input" type="number" min="0" step="10" value={form.salary_hourly_to} onChange={set('salary_hourly_to')} placeholder="1 100" />
              </Field>
            </div>
            <p className="create-note">Достаточно указать зарплату в месяц или в час — можно и то, и другое.</p>
          </section>

          {/* 3) График и часы */}
          <section className="create-section">
            <h2 className="create-section__title">График и рабочие часы</h2>
            <Field label="Продолжительность вахты" required hint="Можно выбрать несколько">
              <ChoiceChips
                multi
                options={SHIFT_LENGTHS.map((d) => ({ value: d, label: `${d} дней` }))}
                value={form.shift_length}
                onChange={(v) => setForm((f) => ({ ...f, shift_length: v }))}
                ariaLabel="Продолжительность вахты"
              />
            </Field>
            <Field label="График работы" required hint="Можно выбрать несколько">
              <ChoiceChips
                multi
                options={WORK_SCHEDULES.map((s) => ({ value: s, label: s }))}
                value={form.work_schedule}
                onChange={(v) => setForm((f) => ({ ...f, work_schedule: v }))}
                ariaLabel="График работы"
              />
            </Field>
            <Field label="Количество рабочих часов в смену" required hint="Можно выбрать несколько">
              <ChoiceChips
                multi
                options={HOURS_PER_SHIFT.map((h) => ({ value: h, label: `${h} часов` }))}
                value={form.hours_per_shift}
                onChange={(v) => setForm((f) => ({ ...f, hours_per_shift: v }))}
                ariaLabel="Количество рабочих часов"
              />
            </Field>
          </section>

          {/* 4) Описание и обязанности */}
          <section className="create-section">
            <h2 className="create-section__title">Описание и обязанности</h2>
            <Field label="Описание вакансии" required>
              <textarea className="form-textarea" rows={5} value={form.description} onChange={set('description')} placeholder="Условия работы, что предлагает компания…" />
            </Field>
            <Field label="Обязанности" hint="Каждое требование — с новой строки">
              <textarea className="form-textarea" rows={5} value={form.duties} onChange={set('duties')} placeholder={'Управление буровой установкой\nКонтроль технического состояния оборудования'} />
            </Field>
          </section>

          {/* 5) Условия проживания */}
          <section className="create-section">
            <h2 className="create-section__title">Условия проживания</h2>
            <Field label="Условия проживания" hint="Сколько мест в комнате, что есть в общежитии…">
              <textarea className="form-textarea" rows={4} value={form.living_conditions} onChange={set('living_conditions')} placeholder={'Бесплатное благоустроенное общежитие (2–3 человека в комнате)\nТрёхразовое питание в столовой'} />
            </Field>
            <Field label="Адрес общежития">
              <input className="form-input" type="text" value={form.dorm_address} onChange={set('dorm_address')} placeholder="г. Новый Уренгой, ул. Промысловая, д. 12" />
            </Field>
            <Field label="Схема проезда">
              <textarea className="form-textarea" rows={3} value={form.dorm_route} onChange={set('dorm_route')} placeholder="Как добраться до общежития…" />
            </Field>
            <PhotoPicker
              title="Файл схемы проезда"
              photos={form.dorm_route_photo ? [form.dorm_route_photo] : []}
              onChange={(arr) => setForm((f) => ({ ...f, dorm_route_photo: arr[0] || null }))}
              limit={1}
            />
          </section>

          {/* 6) Фото */}
          <section className="create-section">
            <h2 className="create-section__title">Фото</h2>
            <PhotoPicker
              title="Фото места работы"
              photos={form.work_photos}
              onChange={(photos) => setForm((f) => ({ ...f, work_photos: photos }))}
            />
            <PhotoPicker
              title="Фото проживания"
              photos={form.dorm_photos}
              onChange={(photos) => setForm((f) => ({ ...f, dorm_photos: photos }))}
            />
            <p className="create-note">Не более {MAX_PHOTOS} фото в каждой группе. Поддерживаются JPG, PNG, WebP.</p>
          </section>

          {/* 7) Акции клиента */}
          <section className="create-section">
            <h2 className="create-section__title">Акции клиента</h2>
            {form.promos.map((promo, i) => (
              <div className="promo-row" key={i}>
                <input
                  className="form-input"
                  type="text"
                  value={promo.title}
                  placeholder="Название акции (например: Приведи друга — 5 000 ₽)"
                  onChange={(e) => setForm((f) => {
                    const promos = [...f.promos];
                    promos[i] = { ...promos[i], title: e.target.value };
                    return { ...f, promos };
                  })}
                />
                <input
                  className="form-input"
                  type="text"
                  value={promo.text}
                  placeholder="Описание акции"
                  onChange={(e) => setForm((f) => {
                    const promos = [...f.promos];
                    promos[i] = { ...promos[i], text: e.target.value };
                    return { ...f, promos };
                  })}
                />
                {form.promos.length > 1 && (
                  <button
                    type="button"
                    className="promo-row__remove"
                    onClick={() => setForm((f) => ({ ...f, promos: f.promos.filter((_, idx) => idx !== i) }))}
                    aria-label="Удалить акцию"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setForm((f) => ({ ...f, promos: [...f.promos, { title: '', text: '' }] }))}
            >
              + Добавить акцию
            </button>
          </section>

          {/* 8) Требования */}
          <section className="create-section">
            <h2 className="create-section__title">Требования к соискателю</h2>
            <Field label="Питание" required>
              <ChoiceChips options={MEALS_OPTIONS} value={form.meals} onChange={(v) => setForm((f) => ({ ...f, meals: v }))} ariaLabel="Питание" />
            </Field>
            <Field label="Медицинская книжка" required>
              <ChoiceChips options={MED_BOOK_OPTIONS} value={form.med_book} onChange={(v) => setForm((f) => ({ ...f, med_book: v }))} ariaLabel="Медицинская книжка" />
            </Field>
            <Field label="Требуется ли опыт работы" required>
              <ChoiceChips options={EXPERIENCE_OPTIONS} value={form.experience_required} onChange={(v) => setForm((f) => ({ ...f, experience_required: v }))} ariaLabel="Требуется ли опыт работы" />
            </Field>
            {form.experience_required === true && (
              <Field label="Требования к опыту" required hint="Появляется при выборе «Да»">
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.experience_requirements}
                  onChange={set('experience_requirements')}
                  placeholder="Например: опыт работы от 3 лет, удостоверение машиниста"
                />
              </Field>
            )}
            <Field label="Спецодежда" required>
              <ChoiceChips options={CLOTHING_OPTIONS} value={form.clothing} onChange={(v) => setForm((f) => ({ ...f, clothing: v }))} ariaLabel="Спецодежда" />
            </Field>
            <Field label="Оплачиваем проезд" required>
              <ChoiceChips options={TRAVEL_OPTIONS} value={form.travel_paid} onChange={(v) => setForm((f) => ({ ...f, travel_paid: v }))} ariaLabel="Оплачиваем проезд" />
            </Field>
          </section>

          {/* Кнопки */}
          <div className="create-actions">
            <button className="btn btn--reset" type="button" onClick={handleBack}>
              ← Назад
            </button>
            <span className="create-actions__spacer" />
            <button className="btn btn--ghost" type="button" onClick={() => setPreview(buildPreview())}>
              Предосмотр
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Публикуем…' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </main>

      {preview && <PreviewModal vacancy={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

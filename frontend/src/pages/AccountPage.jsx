import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { loadSession, saveSession } from '../lib/auth.js';
import { updateJobSeeker } from '../api/auth.js';
import { updateLegalCompany, updateLegalRegistrant } from '../api/legal.js';
import {
  formatPhoneDigits,
} from '../lib/legal.js';
import { showToast } from '../lib/toast.js';
import '../../css/account.css';

/* Телефон из базы хранится в каноническом виде +7XXXXXXXXXX —
   показываем в маске +7 (XXX) XXX-XX-XX как в форме регистрации. */
function formatPhone(canonical) {
  if (!canonical) return '';
  const digits = canonical.replace(/\D+/g, '');
  return formatPhoneDigits(digits.length === 11 ? digits.slice(1) : digits);
}

/* Дата регистрации (UTC) — в виде «21 августа 2026 г.». */
function formatDate(iso) {
  if (!iso) return '';
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(hasTz ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* Дата рождения: сервер отдаёт ISO «2026-08-21», показываем ДД.ММ.ГГГГ. */
function isoToRuDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/* Одна строка «метка — значение» (только чтение). */
function Field({ label, value }) {
  return (
    <div className="acc-field">
      <dt className="acc-field__label">{label}</dt>
      <dd className="acc-field__value">{value}</dd>
    </div>
  );
}

/* Редактируемое поле: подпись + контрол. */
function EditField({ label, required = false, children }) {
  return (
    <div className="acc-field">
      <span className="acc-field__label">
        {label}
        {required && <span className="acc-field__req" aria-hidden="true">*</span>}
      </span>
      <div className="acc-field__control">{children}</div>
    </div>
  );
}

/* Варианты выпадающих списков профиля соискателя (как в задании). */
const GENDER_OPTIONS = ['Муж.', 'Жен.'];
const CITIZENSHIP_OPTIONS = ['Российская Федерация', 'Казахстан', 'Беларусь'];
const MEDICAL_BOOK_OPTIONS = ['Да', 'Нет'];

/* Личный кабинет: данные пользователя (и организации для legal).
   Согласие на обработку персональных данных на странице не
   показывается — оно остаётся в базе и сохраняется бэкендом.
   Телефон (ключ входа) и ИНН (ключ организации) не редактируются —
   только просмотр. Изменения сохраняются на сервере и в сессии
   (localStorage). Без авторизации страница недоступна:
   перенаправляет на /login. */
export default function AccountPage() {
  const [data, setData] = useState(() => loadSession());
  // Какая карточка в режиме редактирования: 'user' | 'company-<id>' | null.
  const [editing, setEditing] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    birthDate: '',
    age: '',
    gender: '',
    passport: '',
    citizenship: '',
    medicalBook: '',
  });
  const [companyForm, setCompanyForm] = useState({ id: null, name: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Модальное окно смены пароля.
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }

  const isJobseeker = data.user_type === 'jobseeker';
  const person = isJobseeker ? data.jobseeker : data.registrant;

  function startUserEdit() {
    const js = data.jobseeker || {};
    setUserForm({
      fullName: person.full_name,
      birthDate: js.date_of_birth || '',
      age: js.age == null ? '' : String(js.age),
      gender: js.gender || '',
      passport: js.passport || '',
      citizenship: js.citizenship || '',
      medicalBook: js.medical_book || '',
    });
    setErrors({});
    setError('');
    setEditing('user');
  }

  function startCompanyEdit(company) {
    setCompanyForm({ id: company.id, name: company.name });
    setErrors({});
    setError('');
    setEditing(`company-${company.id}`);
  }

  function cancelEdit() {
    setEditing(null);
    setError('');
  }

  function validateUser() {
    const e = {};
    if (userForm.fullName.trim().length < 2) e.fullName = 'Укажите ФИО';

    // Поля профиля — только у соискателя (физического лица).
    if (isJobseeker) {
      // Дата рождения: обязательное поле, без ограничений по диапазону.
      if (!userForm.birthDate) {
        e.birthDate = 'Укажите дату рождения';
      }

      const age = Number(userForm.age);
      if (!/^\d+$/.test(userForm.age.trim()) || !Number.isInteger(age) || age < 1 || age > 120) {
        e.age = 'Укажите возраст (от 1 до 120)';
      }

      if (!userForm.gender) e.gender = 'Выберите пол';
      if (userForm.passport.trim().length < 6) {
        e.passport = 'Укажите серию и номер паспорта';
      }
      if (!userForm.citizenship) e.citizenship = 'Выберите гражданство';
      // Медицинская книжка — необязательное поле.
    }
    return e;
  }

  function validateCompany() {
    const e = {};
    if (companyForm.name.trim().length < 2) e.name = 'Укажите название организации';
    return e;
  }

  /* Сохранение данных пользователя. У соискателя — ФИО и поля профиля;
     у регистратора — только ФИО (телефон и согласие не редактируются). */
  async function saveUser(ev) {
    ev.preventDefault();
    const errs = validateUser();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError('');
    try {
      const base = {
        full_name: userForm.fullName.trim(),
        phone: data.jobseeker?.phone ?? data.registrant.phone,
      };
      const profile = isJobseeker
        ? {
            date_of_birth: isoToRuDate(userForm.birthDate),
            age: Number(userForm.age),
            gender: userForm.gender,
            passport: userForm.passport.trim(),
            citizenship: userForm.citizenship,
            medical_book: userForm.medicalBook || null,
          }
        : {};
      const updated = isJobseeker
        ? await updateJobSeeker(data.jobseeker.id, { ...base, ...profile })
        : await updateLegalRegistrant(data.registrant.id, base);
      const next = isJobseeker
        ? { ...data, jobseeker: { ...data.jobseeker, ...updated } }
        : { ...data, registrant: { ...data.registrant, ...updated } };
      saveSession(next);
      setData(next);
      setEditing(null);
      showToast('Данные обновлены');
    } catch (err) {
      setError(err.message || 'Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  }

  /* Сохранение данных организации (только название — ИНН
     не редактируется и передаётся серверу без изменений). */
  async function saveCompany(ev) {
    ev.preventDefault();
    const errs = validateCompany();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError('');
    try {
      const company = data.companies.find((c) => c.id === companyForm.id);
      const updated = await updateLegalCompany(companyForm.id, {
        name: companyForm.name.trim(),
        inn: company ? company.inn : '',
      });
      const next = {
        ...data,
        companies: data.companies.map((c) =>
          c.id === updated.id ? { ...c, ...updated } : c
        ),
      };
      saveSession(next);
      setData(next);
      setEditing(null);
      showToast('Данные организации обновлены');
    } catch (err) {
      setError(err.message || 'Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header />

      <main className="acc-page">
        <div className={isJobseeker ? 'acc-container' : 'acc-container acc-container--wide'}>
          <h1 className="acc-title">Личный кабинет</h1>
          <p className="acc-subtitle">
            {isJobseeker
              ? 'Данные, которые вы указали при регистрации для поиска работы'
              : 'Данные, которые вы указали при регистрации организации'}
          </p>

          <div className={isJobseeker ? '' : 'acc-layout'}>
            <div className={isJobseeker ? '' : 'acc-layout__main'}>
              {/* Данные пользователя (общие для обоих типов) */}
              <section className="acc-card" aria-labelledby="acc-user-title">
            <div className="acc-card__head">
              <h2 className="acc-card__title" id="acc-user-title">
                Данные пользователя
              </h2>
              <div className="acc-head__actions">
                {editing !== 'user' && (
                  <button
                    className="btn btn--ghost acc-edit-btn"
                    type="button"
                    onClick={startUserEdit}
                  >
                    Редактировать
                  </button>
                )}
                <button
                  className="btn btn--ghost acc-edit-btn"
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                >
                  Изменить пароль
                </button>
              </div>
            </div>

            {editing === 'user' ? (
              <form onSubmit={saveUser} noValidate>
                <dl className="acc-fields">
                  <EditField label="ФИО">
                    <input
                      className="acc-input"
                      type="text"
                      value={userForm.fullName}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                    />
                    {errors.fullName && <p className="acc-error">{errors.fullName}</p>}
                  </EditField>

                  <Field label="Телефон" value={formatPhone(person.phone)} />

                  {isJobseeker && (
                    <>
                      <EditField label="Дата рождения" required>
                        <input
                          className="acc-input"
                          type="date"
                          value={userForm.birthDate}
                          onChange={(e) =>
                            setUserForm((f) => ({ ...f, birthDate: e.target.value }))
                          }
                        />
                        {errors.birthDate && <p className="acc-error">{errors.birthDate}</p>}
                      </EditField>

                      <EditField label="Возраст" required>
                        <input
                          className="acc-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="Например, 30"
                          value={userForm.age}
                          onChange={(e) =>
                            setUserForm((f) => ({
                              ...f,
                              age: e.target.value.replace(/\D+/g, '').slice(0, 3),
                            }))
                          }
                        />
                        {errors.age && <p className="acc-error">{errors.age}</p>}
                      </EditField>

                      <EditField label="Пол" required>
                        <select
                          className="acc-input acc-select"
                          value={userForm.gender}
                          onChange={(e) => setUserForm((f) => ({ ...f, gender: e.target.value }))}
                        >
                          <option value="">Не выбран</option>
                          {GENDER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        {errors.gender && <p className="acc-error">{errors.gender}</p>}
                      </EditField>

                      <EditField label="Серия и номер паспорта" required>
                        <input
                          className="acc-input"
                          type="text"
                          value={userForm.passport}
                          onChange={(e) =>
                            setUserForm((f) => ({ ...f, passport: e.target.value }))
                          }
                        />
                        {errors.passport && <p className="acc-error">{errors.passport}</p>}
                      </EditField>

                      <EditField label="Гражданство" required>
                        <select
                          className="acc-input acc-select"
                          value={userForm.citizenship}
                          onChange={(e) =>
                            setUserForm((f) => ({ ...f, citizenship: e.target.value }))
                          }
                        >
                          <option value="">Не выбрано</option>
                          {CITIZENSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        {errors.citizenship && <p className="acc-error">{errors.citizenship}</p>}
                      </EditField>

                      <EditField label="Медицинская книжка">
                        <select
                          className="acc-input acc-select"
                          value={userForm.medicalBook}
                          onChange={(e) =>
                            setUserForm((f) => ({ ...f, medicalBook: e.target.value }))
                          }
                        >
                          <option value="">Не указано</option>
                          {MEDICAL_BOOK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </EditField>
                    </>
                  )}

                  <Field label="Дата регистрации" value={formatDate(person.created_at)} />
                </dl>

                {error && (
                  <div className="acc-banner" role="alert">{error}</div>
                )}
                <div className="acc-actions">
                  <button className="btn btn--primary" type="submit" disabled={saving}>
                    {saving ? 'Сохраняем…' : 'Сохранить'}
                  </button>
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <dl className="acc-fields">
                <Field label="ФИО" value={person.full_name} />
                <Field label="Телефон" value={formatPhone(person.phone)} />
                {isJobseeker && (
                  <>
                    <Field
                      label="Дата рождения"
                      value={isoToRuDate(person.date_of_birth) || '—'}
                    />
                    <Field
                      label="Возраст"
                      value={person.age == null ? '—' : String(person.age)}
                    />
                    <Field label="Пол" value={person.gender || '—'} />
                    <Field label="Серия и номер паспорта" value={person.passport || '—'} />
                    <Field label="Гражданство" value={person.citizenship || '—'} />
                    <Field label="Медицинская книжка" value={person.medical_book || '—'} />
                  </>
                )}
                <Field label="Дата регистрации" value={formatDate(person.created_at)} />
              </dl>
            )}
          </section>

          {/* Данные организации (только для юридического лица) */}
          {!isJobseeker && (
            <section className="acc-card" aria-labelledby="acc-company-title">
              <h2 className="acc-card__title" id="acc-company-title">
                Данные организации
              </h2>
              {data.companies.length === 0 ? (
                <p className="acc-empty">Организации не найдены.</p>
              ) : (
                data.companies.map((company) => {
                  const isEditing = editing === `company-${company.id}`;
                  return (
                    <div
                      className="acc-company"
                      key={company.id}
                      aria-label={`Организация: ${company.name}`}
                    >
                      <div className="acc-card__head acc-company__head">
                        <h3 className="acc-company__name">{company.name}</h3>
                        {!isEditing && (
                          <button
                            className="btn btn--ghost acc-edit-btn"
                            type="button"
                            onClick={() => startCompanyEdit(company)}
                          >
                            Редактировать
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <form onSubmit={saveCompany} noValidate>
                          <dl className="acc-fields">
                            <EditField label="Название организации">
                              <input
                                className="acc-input"
                                type="text"
                                value={companyForm.name}
                                onChange={(e) =>
                                  setCompanyForm((f) => ({ ...f, name: e.target.value }))
                                }
                              />
                              {errors.name && <p className="acc-error">{errors.name}</p>}
                            </EditField>

                            <Field label="ИНН" value={company.inn} />
                          </dl>

                          {error && (
                            <div className="acc-banner" role="alert">{error}</div>
                          )}
                          <div className="acc-actions">
                            <button
                              className="btn btn--primary"
                              type="submit"
                              disabled={saving}
                            >
                              {saving ? 'Сохраняем…' : 'Сохранить'}
                            </button>
                            <button
                              className="btn btn--ghost"
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Отмена
                            </button>
                          </div>
                        </form>
                      ) : (
                        <dl className="acc-fields">
                          <Field label="Название организации" value={company.name} />
                          <Field label="ИНН" value={company.inn} />
                        </dl>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          )}
            </div>

            {/* Меню «Работа с вакансиями» — только у юридического лица */}
            {!isJobseeker && (
              <aside className="acc-layout__side">
                <nav className="acc-card acc-menu" aria-label="Работа с вакансиями">
                  <h2 className="acc-card__title">Работа с вакансиями</h2>
                  <div className="acc-menu__row">
                    <Link className="acc-menu__item" to="/company/vacancies">
                      <span className="acc-menu__item-title">Список вакансий</span>
                      <span className="acc-menu__item-desc">
                        Опубликованные, черновики и архив
                      </span>
                    </Link>
                    <Link className="btn btn--primary acc-menu__btn" to="/vacancy/new">
                      Разместить вакансию
                    </Link>
                  </div>
                </nav>
              </aside>
            )}
          </div>
        </div>
      </main>

      {passwordOpen && (
        <ChangePasswordModal
          userType={data.user_type}
          phone={person.phone}
          onClose={() => setPasswordOpen(false)}
        />
      )}
    </>
  );
}

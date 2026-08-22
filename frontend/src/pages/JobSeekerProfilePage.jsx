import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import JobSeekerCabinetNav from '../components/JobSeekerCabinetNav';
import {
  EditField,
  Field,
  formatDate,
  formatPhone,
  isoToRuDate,
  ageFromBirthDate,
} from '../components/accountFields.jsx';
import { loadSession, saveSession } from '../lib/auth.js';
import { updateJobSeeker } from '../api/auth.js';
import { uploadPhotos } from '../api.js';
import { normalizeLogo } from '../lib/format.js';
import { showToast } from '../lib/toast.js';
import '../../css/account.css';

const GENDER_OPTIONS = ['Муж.', 'Жен.'];
const CITIZENSHIP_OPTIONS = ['Российская Федерация', 'Казахстан', 'Беларусь'];
const MEDICAL_BOOK_OPTIONS = ['Да', 'Нет'];

/* Страница «Профиль вахтовика»: данные, указанные при регистрации
   и редактируемые в личном кабинете. */
export default function JobSeekerProfilePage() {
  const [data, setData] = useState(() => loadSession());
  const [editing, setEditing] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    birthDate: '',
    age: '',
    gender: '',
    passport: '',
    citizenship: '',
    medicalBook: '',
    photoFile: null,
    photoPreview: null,
    photoPath: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const photoInputRef = useRef(null);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'jobseeker') {
    return <Navigate to="/account" replace />;
  }

  const person = data.jobseeker;

  function startUserEdit() {
    setUserForm({
      fullName: person.full_name,
      birthDate: person.date_of_birth || '',
      age: ageFromBirthDate(person.date_of_birth),
      gender: person.gender || '',
      passport: person.passport || '',
      citizenship: person.citizenship || '',
      medicalBook: person.medical_book || '',
      photoFile: null,
      photoPreview: normalizeLogo(person.photo),
      photoPath: person.photo || null,
    });
    setErrors({});
    setError('');
    setEditing('user');
  }

  function revokePreview(url) {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  function cancelEdit() {
    revokePreview(userForm.photoPreview);
    setEditing(null);
    setError('');
  }

  function onPhotoChange(e) {
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Выберите изображение');
      return;
    }
    revokePreview(userForm.photoPreview);
    setUserForm((f) => ({
      ...f,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
    }));
  }

  function removePhoto() {
    revokePreview(userForm.photoPreview);
    setUserForm((f) => ({
      ...f,
      photoFile: null,
      photoPreview: null,
      photoPath: null,
    }));
  }

  function validateUser() {
    const e = {};
    if (userForm.fullName.trim().length < 2) e.fullName = 'Укажите ФИО';
    if (!userForm.birthDate) e.birthDate = 'Укажите дату рождения';

    const age = Number(ageFromBirthDate(userForm.birthDate));
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      e.age = 'Возраст считается по дате рождения';
    }

    if (!userForm.gender) e.gender = 'Выберите пол';
    if (userForm.passport.trim().length < 6) {
      e.passport = 'Укажите серию и номер паспорта';
    }
    if (!userForm.citizenship) e.citizenship = 'Выберите гражданство';
    return e;
  }

  async function saveUser(ev) {
    ev.preventDefault();
    const errs = validateUser();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError('');
    try {
      let photo = userForm.photoPath || null;
      if (userForm.photoFile) {
        const uploaded = await uploadPhotos([userForm.photoFile]);
        photo = uploaded.paths?.[0] || null;
      }
      const updated = await updateJobSeeker(data.jobseeker.id, {
        full_name: userForm.fullName.trim(),
        phone: data.jobseeker.phone,
        date_of_birth: isoToRuDate(userForm.birthDate),
        age: Number(ageFromBirthDate(userForm.birthDate)),
        gender: userForm.gender,
        passport: userForm.passport.trim(),
        citizenship: userForm.citizenship,
        medical_book: userForm.medicalBook || null,
        photo,
      });
      revokePreview(userForm.photoPreview);
      const next = { ...data, jobseeker: { ...data.jobseeker, ...updated } };
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

  return (
    <>
      <Header />

      <main className="acc-page">
        <div className="acc-container acc-container--wide">
          <div className="acc-layout">
            <JobSeekerCabinetNav person={person} />

            <div className="acc-layout__main">
              <h1 className="acc-title">Профиль вахтовика</h1>
              <p className="acc-subtitle">
                Данные, которые вы указали при регистрации для поиска работы
              </p>

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
                      <EditField label="Фото">
                        <div className="acc-avatar-picker">
                          {userForm.photoPreview ? (
                            <img
                              className="acc-avatar-preview"
                              src={userForm.photoPreview}
                              alt="Фото профиля"
                            />
                          ) : (
                            <span className="acc-avatar-preview acc-avatar-preview--empty">Нет фото</span>
                          )}
                          <div className="acc-avatar-picker__actions">
                            <button
                              className="btn btn--ghost acc-edit-btn"
                              type="button"
                              onClick={() => photoInputRef.current?.click()}
                            >
                              {userForm.photoPreview ? 'Заменить фото' : 'Добавить фото'}
                            </button>
                            {userForm.photoPreview && (
                              <button
                                className="btn btn--reset acc-edit-btn"
                                type="button"
                                onClick={removePhoto}
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                          <input
                            ref={photoInputRef}
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={onPhotoChange}
                          />
                        </div>
                      </EditField>

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

                      <EditField label="Дата рождения" required>
                        <input
                          className="acc-input"
                          type="date"
                          value={userForm.birthDate}
                          onChange={(e) => {
                            const birthDate = e.target.value;
                            setUserForm((f) => ({
                              ...f,
                              birthDate,
                              age: ageFromBirthDate(birthDate),
                            }));
                          }}
                        />
                        {errors.birthDate && <p className="acc-error">{errors.birthDate}</p>}
                      </EditField>

                      <EditField label="Возраст">
                        <input
                          className="acc-input acc-input--readonly"
                          type="text"
                          value={userForm.age}
                          readOnly
                          tabIndex={-1}
                          placeholder="Считается по дате рождения"
                          aria-readonly="true"
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
                    <div className="acc-field">
                      <dt className="acc-field__label">Фото</dt>
                      <dd className="acc-field__value">
                        {person.photo ? (
                          <img
                            className="acc-avatar-preview"
                            src={normalizeLogo(person.photo)}
                            alt="Фото профиля"
                          />
                        ) : (
                          'Не загружено'
                        )}
                      </dd>
                    </div>
                    <Field label="ФИО" value={person.full_name} />
                    <Field label="Телефон" value={formatPhone(person.phone)} />
                    <Field
                      label="Дата рождения"
                      value={isoToRuDate(person.date_of_birth) || '—'}
                    />
                    <Field
                      label="Возраст"
                      value={ageFromBirthDate(person.date_of_birth) || '—'}
                    />
                    <Field label="Пол" value={person.gender || '—'} />
                    <Field label="Серия и номер паспорта" value={person.passport || '—'} />
                    <Field label="Гражданство" value={person.citizenship || '—'} />
                    <Field label="Медицинская книжка" value={person.medical_book || '—'} />
                    <Field label="Дата регистрации" value={formatDate(person.created_at)} />
                  </dl>
                )}
              </section>
            </div>
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

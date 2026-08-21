import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CompanyCabinetNav from '../components/CompanyCabinetNav';
import { EditField, Field, formatDate, formatPhone } from '../components/accountFields.jsx';
import { loadSession, saveSession } from '../lib/auth.js';
import { updateLegalCompany, updateLegalRegistrant } from '../api/legal.js';
import { showToast } from '../lib/toast.js';
import '../../css/account.css';

/* Страница «Профиль компании»: данные регистратора и организации,
   которые раньше были в центре личного кабинета. Доступна только
   юридическому лицу. */
export default function CompanyProfilePage() {
  const [data, setData] = useState(() => loadSession());
  const [editing, setEditing] = useState(null);
  const [userForm, setUserForm] = useState({ fullName: '' });
  const [companyForm, setCompanyForm] = useState({ id: null, name: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'legal') {
    return <Navigate to="/account" replace />;
  }

  const person = data.registrant;
  const company = data.companies?.[0] || null;

  function startUserEdit() {
    setUserForm({ fullName: person.full_name });
    setErrors({});
    setError('');
    setEditing('user');
  }

  function startCompanyEdit(org) {
    setCompanyForm({ id: org.id, name: org.name });
    setErrors({});
    setError('');
    setEditing(`company-${org.id}`);
  }

  function cancelEdit() {
    setEditing(null);
    setError('');
  }

  async function saveUser(ev) {
    ev.preventDefault();
    const errs = {};
    if (userForm.fullName.trim().length < 2) errs.fullName = 'Укажите ФИО';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError('');
    try {
      const updated = await updateLegalRegistrant(data.registrant.id, {
        full_name: userForm.fullName.trim(),
        phone: data.registrant.phone,
      });
      const next = { ...data, registrant: { ...data.registrant, ...updated } };
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

  async function saveCompany(ev) {
    ev.preventDefault();
    const errs = {};
    if (companyForm.name.trim().length < 2) errs.name = 'Укажите название организации';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError('');
    try {
      const current = data.companies.find((c) => c.id === companyForm.id);
      const updated = await updateLegalCompany(companyForm.id, {
        name: companyForm.name.trim(),
        inn: current ? current.inn : '',
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
        <div className="acc-container acc-container--wide">
          <div className="acc-layout">
            <CompanyCabinetNav company={company} />

            <div className="acc-layout__main">
              <h1 className="acc-title">Профиль компании</h1>
              <p className="acc-subtitle">
                Данные, которые вы указали при регистрации организации
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
                    <Field label="Дата регистрации" value={formatDate(person.created_at)} />
                  </dl>
                )}
              </section>

              <section className="acc-card" aria-labelledby="acc-company-title">
                <h2 className="acc-card__title" id="acc-company-title">
                  Данные организации
                </h2>
                {data.companies.length === 0 ? (
                  <p className="acc-empty">Организации не найдены.</p>
                ) : (
                  data.companies.map((org) => {
                    const isEditing = editing === `company-${org.id}`;
                    return (
                      <div
                        className="acc-company"
                        key={org.id}
                        aria-label={`Организация: ${org.name}`}
                      >
                        <div className="acc-card__head acc-company__head">
                          <h3 className="acc-company__name">{org.name}</h3>
                          {!isEditing && (
                            <button
                              className="btn btn--ghost acc-edit-btn"
                              type="button"
                              onClick={() => startCompanyEdit(org)}
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
                              <Field label="ИНН" value={org.inn} />
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
                            <Field label="Название организации" value={org.name} />
                            <Field label="ИНН" value={org.inn} />
                          </dl>
                        )}
                      </div>
                    );
                  })
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

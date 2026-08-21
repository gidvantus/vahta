import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import CompanyCabinetNav from '../components/CompanyCabinetNav';
import { Field, formatDate, formatPhone, isoToRuDate, ageFromBirthDate } from '../components/accountFields.jsx';
import { fetchApplicantProfile } from '../api/applications.js';
import { loadSession } from '../lib/auth.js';
import { normalizeLogo } from '../lib/format.js';
import '../../css/account.css';
import '../../css/company.css';

/* Просмотр профиля вахтовика из откликов компании. */
export default function CompanyJobSeekerProfilePage() {
  const { jobseekerId } = useParams();
  const data = loadSession();
  const company = data?.companies?.[0] || null;
  const companyId = company?.id;
  const [person, setPerson] = useState(null);
  const [state, setState] = useState(companyId ? 'loading' : 'ready');

  useEffect(() => {
    if (!companyId || !jobseekerId) return undefined;
    let alive = true;
    setState('loading');
    fetchApplicantProfile(jobseekerId, companyId)
      .then((p) => {
        if (!alive) return;
        setPerson(p);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
    };
  }, [companyId, jobseekerId]);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'legal') {
    return <Navigate to="/account" replace />;
  }

  return (
    <>
      <Header />
      <main className="acc-page">
        <div className="acc-container acc-container--wide">
          <div className="acc-layout">
            <CompanyCabinetNav company={company} />
            <div className="acc-layout__main">
              <p className="cabinet-breadcrumbs">
                <Link to="/company/applications">Отклики</Link>
                <span className="cabinet-breadcrumbs__sep">/</span>
                <span className="cabinet-breadcrumbs__current">Профиль вахтовика</span>
              </p>
              <h1 className="acc-title">Профиль вахтовика</h1>
              <p className="acc-subtitle">
                Данные соискателя, который откликнулся на вашу вакансию
              </p>

              {state === 'loading' && (
                <div className="empty-state">
                  <h3>Загружаем профиль…</h3>
                </div>
              )}

              {state === 'error' && (
                <div className="empty-state">
                  <h3>Профиль недоступен</h3>
                  <p>Посмотреть можно только вахтовика, который откликался на ваши вакансии.</p>
                  <Link className="btn btn--ghost" to="/company/applications">
                    К откликам
                  </Link>
                </div>
              )}

              {state === 'ready' && person && (
                <section className="acc-card" aria-labelledby="js-profile-title">
                  <div className="acc-card__head">
                    <h2 className="acc-card__title" id="js-profile-title">
                      Данные пользователя
                    </h2>
                  </div>
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
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { fetchAccount } from '../api/legal.js';
import { formatPhoneDigits } from '../lib/legal.js';
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

/* Одна строка «метка — значение» в карточке данных. */
function Field({ label, value }) {
  return (
    <div className="acc-field">
      <dt className="acc-field__label">{label}</dt>
      <dd className="acc-field__value">{value}</dd>
    </div>
  );
}

export default function AccountPage() {
  const [state, setState] = useState({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    fetchAccount()
      .then((data) => setState({ status: 'ok', data }))
      .catch((err) =>
        setState({ status: 'error', message: err.message || 'Не удалось загрузить данные' })
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header />

      <main className="acc-page">
        <div className="acc-container">
          <h1 className="acc-title">Личный кабинет</h1>
          <p className="acc-subtitle">
            Данные, которые вы указали при регистрации организации
          </p>

          {state.status === 'loading' && (
            <div className="acc-card acc-card--notice">Загружаем данные…</div>
          )}

          {state.status === 'error' && (
            <div className="acc-card acc-card--notice">
              <div className="acc-banner" role="alert">{state.message}</div>
              <button className="btn btn--primary" type="button" onClick={load}>
                Повторить
              </button>
            </div>
          )}

          {state.status === 'ok' && state.data === null && (
            <div className="acc-card acc-card--notice">
              <p className="acc-empty">
                Зарегистрированных пользователей пока нет.
              </p>
              <Link className="btn btn--primary" to="/register-company">
                Зарегистрировать организацию
              </Link>
            </div>
          )}

          {state.status === 'ok' && state.data && (
            <>
              <section className="acc-card" aria-labelledby="acc-user-title">
                <h2 className="acc-card__title" id="acc-user-title">
                  Данные пользователя
                </h2>
                <dl className="acc-fields">
                  <Field label="ФИО" value={state.data.registrant.full_name} />
                  <Field label="Телефон" value={formatPhone(state.data.registrant.phone)} />
                  <Field
                    label="Согласие на обработку персональных данных"
                    value={state.data.registrant.consent ? 'Дано' : 'Не дано'}
                  />
                  <Field
                    label="Дата регистрации"
                    value={formatDate(state.data.registrant.created_at)}
                  />
                </dl>
              </section>

              <section className="acc-card" aria-labelledby="acc-company-title">
                <h2 className="acc-card__title" id="acc-company-title">
                  Данные организации
                </h2>
                {state.data.companies.length === 0 ? (
                  <p className="acc-empty">Организации не найдены.</p>
                ) : (
                  state.data.companies.map((company) => (
                    <div
                      className="acc-company"
                      key={company.id}
                      aria-label={`Организация: ${company.name}`}
                    >
                      <dl className="acc-fields">
                        <Field label="Название организации" value={company.name} />
                        <Field label="ИНН" value={company.inn} />
                        <Field
                          label="Дата регистрации"
                          value={formatDate(company.created_at)}
                        />
                      </dl>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

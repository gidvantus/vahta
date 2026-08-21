import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtSalary, dateLabel, normalizeLogo } from '../lib/format.js';
import { showToast } from '../lib/toast.js';

const IconPin = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconCalendar = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const IconClock = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
const IconCheckBadge = (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#056FF1" /><path d="M6 10.3l2.6 2.6L14.2 7.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function VacancyCard({ vacancy }) {
  const [applied, setApplied] = useState(false);
  const logo = normalizeLogo(vacancy.logo);
  const companyInitial = (vacancy.company || '?').trim().charAt(0).toUpperCase();
  const scheduleChip = vacancy.schedule
    ? `Вахта ${vacancy.schedule}`
    : vacancy.shift_length && vacancy.shift_length.length
      ? `Вахта ${vacancy.shift_length.join('/')} дней`
      : '';

  function handleApply() {
    if (applied) return;
    setApplied(true);
    showToast(`Отклик отправлен! Компания <b>${vacancy.company}</b> получила ваше резюме.`);
  }

  return (
    <article className="vacancy-card">
      {vacancy.company && (
        <div className="vacancy-card__company">
          {logo ? (
            <img src={logo} alt={vacancy.company} />
          ) : (
            <span className="vacancy-card__logo-fallback" aria-hidden="true">{companyInitial}</span>
          )}
        </div>
      )}

      <div className="vacancy-card__body">
        <div className="vacancy-card__top">
          <h3 className="vacancy-card__title">
            <Link to={`/vacancy/${vacancy.id}`}>{vacancy.title}</Link>
          </h3>
          <span className="vacancy-card__date">
            {IconClock}
            {dateLabel(vacancy.published_at)}
          </span>
        </div>

        <p className="vacancy-card__salary">{fmtSalary(vacancy.salary_from, vacancy.salary_to)}</p>

        <div className="vacancy-card__meta">
          <span>{IconPin}{vacancy.city}</span>
          {scheduleChip && (
            <span className="schedule-chip">{IconCalendar}{scheduleChip}</span>
          )}
        </div>

        {vacancy.company && (
          <p className="vacancy-card__company-line">
            {vacancy.verified ? IconCheckBadge : <span className="icon-placeholder" />}
            {vacancy.verified && 'Проверенная компания · '}
            <b>{vacancy.company}</b>
          </p>
        )}
      </div>

      <div className="vacancy-card__actions">
        <button
          className={applied ? 'btn btn--apply is-applied' : 'btn btn--apply'}
          type="button"
          onClick={handleApply}
        >
          {applied ? 'Откликнуться ✓' : 'Откликнуться'}
        </button>
      </div>
    </article>
  );
}

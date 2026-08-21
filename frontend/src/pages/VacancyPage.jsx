import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Carousel from '../components/Carousel';
import { fetchVacancyBySlug } from '../api.js';
import { fmtSalary, normalizeLogo } from '../lib/format.js';
import { showToast } from '../lib/toast.js';
import '../../css/vacancy.css';

/* Демо-фотографии (плейсхолдеры; в БД фото пока не хранятся). */
const WORK_PHOTOS = ['/img/work-1.svg', '/img/work-2.svg', '/img/work-3.svg'];
const DORM_PHOTOS = ['/img/dorm-1.svg', '/img/dorm-2.svg', '/img/dorm-3.svg'];

const IconPin = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconCalendar = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const IconVerified = (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#056FF1" /><path d="M6 10.3l2.6 2.6L14.2 7.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconSearch = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);

function EmptyState({ title, text, children }) {
  return (
    <main className="vacancy-page container">
      <div className="empty-state">
        {IconSearch}
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {children}
      </div>
    </main>
  );
}

export default function VacancyPage() {
  const { slug } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setVacancy(null);
    fetchVacancyBySlug(slug)
      .then((v) => {
        if (!alive) return;
        setVacancy(v);
        setStatus('ready');
        document.title = `${v.title} — Вахта.ру`;
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  function handleApply() {
    if (applied) return;
    setApplied(true);
    showToast(`Отклик отправлен! Компания <b>${vacancy.company}</b> получила ваше резюме.`);
  }

  if (status === 'loading') {
    return (
      <>
        <Header />
        <EmptyState title="Загружаем вакансию…" />
      </>
    );
  }

  if (status === 'error' || !vacancy) {
    return (
      <>
        <Header />
        <EmptyState title="Вакансия не найдена">
          <p>По этому адресу вакансии нет: возможно, она снята с публикации или адрес указан неверно.</p>
          <Link className="btn btn--ghost" to="/">К списку вакансий</Link>
        </EmptyState>
      </>
    );
  }

  const logo = normalizeLogo(vacancy.logo);
  const salary = fmtSalary(vacancy.salary_from, vacancy.salary_to);
  const applyBtn = (
    <button
      className={applied ? 'btn btn--apply is-applied' : 'btn btn--apply'}
      type="button"
      onClick={handleApply}
    >
      {applied ? 'Откликнуться ✓' : 'Откликнуться'}
    </button>
  );

  return (
    <>
      <Header />

      <main className="vacancy-page container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span className="sep">/</span>
          <a href="/">Каталог вакансий</a>
          <span className="sep">/</span>
          <span className="current">{vacancy.title}</span>
        </nav>

        {/* Шапка вакансии */}
        <section className="vacancy-hero">
          <div className="vacancy-hero__info">
            <h1 className="vacancy-hero__title">{vacancy.title}</h1>
            <p className="vacancy-hero__company">
              {vacancy.company}
              {vacancy.verified && (
                <span className="vacancy-hero__verified">{IconVerified}проверенная компания</span>
              )}
            </p>
            <div className="chips">
              {vacancy.city && <span className="chip">{IconPin}{vacancy.city}</span>}
              {vacancy.schedule && <span className="chip">{IconCalendar}Вахта {vacancy.schedule}</span>}
            </div>
          </div>

          <div className="vacancy-hero__actions">
            <p className="vacancy-hero__salary">
              {salary}
              <small>в месяц, на руки</small>
            </p>
            {applyBtn}
          </div>
        </section>

        <div className="vacancy-layout">
          <div className="vacancy-main">

            {/* Фото места работы (демо-плейсхолдеры) */}
            <section className="vsection">
              <h2 className="vsection__title">Фото места работы</h2>
              <Carousel items={WORK_PHOTOS} altPrefix="Фото места работы" />
            </section>

            {/* Описание вакансии */}
            {vacancy.description && (
              <section className="vsection">
                <h2 className="vsection__title">Описание вакансии</h2>
                <p>{vacancy.description}</p>
              </section>
            )}

            {/* Фото места проживания (демо-плейсхолдеры) */}
            <section className="vsection">
              <h2 className="vsection__title">Фото места проживания</h2>
              <Carousel items={DORM_PHOTOS} altPrefix="Фото общежития" />
            </section>

          </div>

          {/* Сайдбар */}
          <aside className="vacancy-side">

            <div className="side-card">
              <h3 className="side-card__title">О вакансии</h3>
              <dl className="side-list">
                <div>
                  <dt>Зарплата</dt>
                  <dd>{salary}</dd>
                </div>
                {vacancy.schedule && (
                  <div>
                    <dt>График вахты</dt>
                    <dd>{vacancy.schedule}</dd>
                  </div>
                )}
                {vacancy.city && (
                  <div>
                    <dt>Город</dt>
                    <dd>{vacancy.city}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="side-card side-employer">
              <h3 className="side-card__title">Работодатель</h3>
              {logo ? (
                <img src={logo} alt={vacancy.company} />
              ) : (
                <span className="vacancy-card__logo-fallback" aria-hidden="true">
                  {(vacancy.company || '?').trim().charAt(0).toUpperCase()}
                </span>
              )}
              <p className="side-employer__name">{vacancy.company}</p>
              {applyBtn}
            </div>

          </aside>
        </div>
      </main>
    </>
  );
}

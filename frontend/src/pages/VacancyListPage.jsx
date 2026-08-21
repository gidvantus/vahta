import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import { loadSession, subscribeAuth } from '../lib/auth.js';
import { fetchCompanyVacancies, updateVacancyStatus } from '../api/company.js';
import { dateLabel, fmtSalary } from '../lib/format.js';
import { showToast } from '../lib/toast.js';
import '../../css/company.css';

/* Вкладки: статус вакансии → заголовок вкладки. */
const TABS = [
  { key: 'published', label: 'Опубликованные' },
  { key: 'draft', label: 'Не опубликованные (Черновик)' },
  { key: 'archived', label: 'Архив' },
];

const TAB_TITLE = {
  published: 'Нет опубликованных вакансий',
  draft: 'Нет черновиков',
  archived: 'Архив пуст',
};

/* Строка вакансии + кнопки перевода между вкладками. */
function VacancyRow({ vacancy, busy, onChangeStatus }) {
  const actions =
    vacancy.status === 'draft'
      ? [['Опубликовать', 'published'], ['В архив', 'archived']]
      : vacancy.status === 'published'
        ? [['Снять с публикации', 'draft'], ['В архив', 'archived']]
        : [['Восстановить', 'draft']];

  return (
    <article className="cabinet-row">
      <div className="cabinet-row__main">
        <h3 className="cabinet-row__title">
          {vacancy.status === 'published' ? (
            <Link to={`/vacancy/${vacancy.full_slug || vacancy.id}`}>{vacancy.title}</Link>
          ) : (
            vacancy.title
          )}
        </h3>
        <p className="cabinet-row__meta">
          <span>{fmtSalary(vacancy.salary_from, vacancy.salary_to)}</span>
          {vacancy.city && <span>{vacancy.city}</span>}
          <span>{dateLabel(vacancy.published_at)}</span>
        </p>
      </div>
      <div className="cabinet-row__actions">
        {actions.map(([label, next]) => (
          <button
            key={next}
            type="button"
            className={next === 'published' ? 'btn btn--primary' : 'btn btn--reset'}
            disabled={busy}
            onClick={() => onChangeStatus(vacancy, next)}
          >
            {label}
          </button>
        ))}
      </div>
    </article>
  );
}

/* Страница «Список вакансий» компании: три вкладки — Опубликованные,
   Не опубликованные (Черновик), Архив. Новая вакансия создаётся
   черновиком и попадает во вкладку «Не опубликованные (Черновик)». */
export default function VacancyListPage() {
  // Сессия читается один раз (useState-инициализатор) — иначе каждый
  // рендер создаёт новый объект и useEffect уходит в бесконечный цикл.
  const [session] = useState(() => loadSession());
  const [tab, setTab] = useState('draft');
  const [lists, setLists] = useState({ draft: [], published: [], archived: [] });
  const [counts, setCounts] = useState({});
  const [state, setState] = useState('loading'); // loading | ready | error
  const [busy, setBusy] = useState(false);

  const company = session?.companies?.[0] || null;

  /* Загружает все три вкладки разом: список активной + счётчики. */
  const load = useCallback(() => {
    if (!company) return undefined;
    let alive = true;
    setState('loading');
    Promise.all(TABS.map((t) => fetchCompanyVacancies(company.id, t.key)))
      .then((results) => {
        if (!alive) return;
        const nextLists = {};
        const nextCounts = {};
        TABS.forEach((t, i) => {
          nextLists[t.key] = results[i].items;
          nextCounts[t.key] = results[i].total;
        });
        setLists(nextLists);
        setCounts(nextCounts);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
    };
  }, [company]);

  useEffect(() => {
    if (company) return load();
    return undefined;
  }, [company, load]);

  // Смена авторизации: при выходе/входе обновляем сессию.
  useEffect(() => {
    return subscribeAuth(() => setSession(loadSession()));
  }, []);

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  // Страница доступна только организациям (legal): соискателя
  // (физическое лицо) перенаправляем в его личный кабинет.
  if (session?.user_type !== 'legal') {
    return <Navigate to="/account" replace />;
  }

  function changeStatus(vacancy, next) {
    setBusy(true);
    updateVacancyStatus(vacancy.id, next)
      .then(() => {
        const message = {
          published: 'Вакансия опубликована и видна в каталоге',
          draft: 'Вакансия снята с публикации',
          archived: 'Вакансия перенесена в архив',
        }[next];
        showToast(message || 'Статус обновлён');
        load();
      })
      .catch((e) => showToast(e.message || 'Не удалось изменить статус'))
      .finally(() => setBusy(false));
  }

  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <>
      <Header />

      <main className="cabinet">
        <nav className="cabinet-breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          <span className="cabinet-breadcrumbs__sep" aria-hidden="true">/</span>
          <Link to="/account">Личный кабинет</Link>
          <span className="cabinet-breadcrumbs__sep" aria-hidden="true">/</span>
          <span className="cabinet-breadcrumbs__current" aria-current="page">Список вакансий</span>
        </nav>

        <div className="cabinet-head">
          <h1>Список вакансий</h1>
          <p className="cabinet-sub">{company ? company.name : 'Организация не найдена'}</p>
        </div>

        {!company && (
          <div className="empty-state">
            <h3>Организации не найдены</h3>
            <p>Зарегистрируйте организацию, чтобы размещать вакансии.</p>
            <Link className="btn btn--ghost" to="/register-company">Зарегистрировать организацию</Link>
          </div>
        )}

        {company && (
          <>
            <div className="cabinet-tabs" role="tablist" aria-label="Статусы вакансий">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={tab === t.key ? 'cabinet-tab is-active' : 'cabinet-tab'}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  {counts[t.key] != null && (
                    <span className="cabinet-tab__count">{counts[t.key]}</span>
                  )}
                </button>
              ))}
            </div>

            <section className="cabinet-list" aria-label={activeTab ? activeTab.label : 'Список вакансий'}>
              {tab === 'draft' && (
                <div className="cabinet-tab-toolbar">
                  <Link className="btn btn--primary" to="/vacancy/new">Разместить вакансию</Link>
                </div>
              )}

              {state === 'loading' && (
                <div className="empty-state">
                  <h3>Загружаем вакансии…</h3>
                </div>
              )}

              {state === 'error' && (
                <div className="empty-state">
                  <h3>Не удалось загрузить вакансии</h3>
                  <p>API личного кабинета компании ещё не готово — список появится, когда оно будет подключено.</p>
                </div>
              )}

              {state === 'ready' && lists[tab].length === 0 && (
                <div className="empty-state">
                  <h3>{TAB_TITLE[tab]}</h3>
                  {tab === 'draft' && (
                    <p>Создайте вакансию — она появится здесь до публикации.</p>
                  )}
                  {tab === 'published' && (
                    <p>Опубликуйте вакансию из вкладки «Не опубликованные (Черновик)».</p>
                  )}
                </div>
              )}

              {state === 'ready' && lists[tab].length > 0 && (
                <div className="cabinet-rows">
                  {lists[tab].map((v) => (
                    <VacancyRow key={v.id} vacancy={v} busy={busy} onChangeStatus={changeStatus} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

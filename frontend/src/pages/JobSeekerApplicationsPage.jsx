import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import JobSeekerCabinetNav from '../components/JobSeekerCabinetNav';
import { fetchJobSeekerApplications, setApplicationWork } from '../api/applications.js';
import { formatDate } from '../components/accountFields.jsx';
import { loadSession } from '../lib/auth.js';
import { showToast } from '../lib/toast.js';
import '../../css/account.css';
import '../../css/company.css';

const TABS = [
  { key: 'pending', label: 'Ожидают решения' },
  { key: 'accepted', label: 'Принятые' },
  { key: 'completed', label: 'Завершенные' },
  { key: 'rejected', label: 'Отказные' },
];

const EMPTY = {
  pending: 'Нет откликов, ожидающих решения',
  accepted: 'Нет принятых откликов',
  completed: 'Нет завершенных откликов',
  rejected: 'Нет отказных откликов',
};

function isCompleted(app) {
  return app.status === 'accepted' && (app.finish_confirmed || app.finish_reject_kind === 'wont_continue');
}

function WaitingConfirm() {
  return <p className="cabinet-row__wait">Ожидаем подтверждения</p>;
}

function StubButton({ className, children }) {
  return (
    <button
      type="button"
      className={`${className} btn--stub`}
      disabled
      title="Пока в разработке"
    >
      {children}
      <span className="btn__soon">скоро</span>
    </button>
  );
}

function statusText(app) {
  if (app.status === 'accepted') {
    if (app.finish_confirmed) {
      return 'Вы завершили работу. Работодатель подтвердил завершение.';
    }
    if (app.finish_reject_kind === 'wont_continue') {
      return (
        <>
          Работодатель отказал в завершении работы: вахтовик не будет дорабатывать
          {app.finish_reject_reason ? `. Причина: ${app.finish_reject_reason}` : ''}
        </>
      );
    }
    if (app.finish_reject_kind === 'incomplete') {
      return (
        <>
          Работодатель отказал в завершении: не до конца доработали
          {app.finish_reject_reason ? `. Причина: ${app.finish_reject_reason}` : ''}
        </>
      );
    }
    if (app.work_status === 'finished') {
      return 'Вы отметили, что завершили работу. Ждём подтверждения работодателя.';
    }
    if (app.work_status === 'started') {
      return app.start_confirmed
        ? 'Вы вышли на работу. Работодатель подтвердил выход.'
        : 'Вы вышли на работу. Ожидается подтверждение работодателя.';
    }
    if (app.work_status === 'departed') {
      return app.arrival_confirmed
        ? 'Вы выехали на работу. Работодатель подтвердил приезд.'
        : 'Вы выехали на работу';
    }
    return 'Вас готовы принять на работу';
  }
  if (app.status === 'rejected') {
    return (
      <>
        Работодатель не готов вас принять на работу
        {app.decision_reason ? `. Причина: ${app.decision_reason}` : ''}
      </>
    );
  }
  if (app.status === 'blocked') {
    return (
      <>
        Работодатель заблокировал вас и запретил просматривать
        вакансии своей компании
        {app.decision_reason ? `. Причина: ${app.decision_reason}` : ''}
      </>
    );
  }
  return 'Ожидает решения работодателя';
}

/* Страница «Мои отклики»: вакансии, на которые откликнулся вахтовик. */
export default function JobSeekerApplicationsPage() {
  const data = loadSession();
  const person = data?.jobseeker || null;
  const jobseekerId = person?.id;
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('pending');
  const [state, setState] = useState(jobseekerId ? 'loading' : 'ready');
  const [busyId, setBusyId] = useState(null);

  const lists = useMemo(() => ({
    pending: items.filter((a) => (a.status || 'pending') === 'pending'),
    accepted: items.filter((a) => a.status === 'accepted' && !isCompleted(a)),
    completed: items.filter((a) => isCompleted(a)),
    rejected: items.filter((a) => a.status === 'rejected' || a.status === 'blocked'),
  }), [items]);

  const visible = lists[tab] || [];
  const counts = {
    pending: lists.pending.length,
    accepted: lists.accepted.length,
    completed: lists.completed.length,
    rejected: lists.rejected.length,
  };

  const load = useCallback(() => {
    if (!jobseekerId) return undefined;
    let alive = true;
    setState('loading');
    fetchJobSeekerApplications(jobseekerId)
      .then((list) => {
        if (!alive) return;
        setItems(list || []);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
    };
  }, [jobseekerId]);

  useEffect(() => load(), [load]);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'jobseeker') {
    return <Navigate to="/account" replace />;
  }

  async function markWork(app, action) {
    setBusyId(app.id);
    try {
      await setApplicationWork(app.id, {
        action,
        jobseeker_id: jobseekerId,
      });
      showToast(
        action === 'departed'
          ? 'Отмечено: выехали на работу'
          : action === 'started'
            ? 'Отмечено: вышли на работу'
            : 'Отмечено: завершили работу',
      );
      load();
    } catch (err) {
      showToast(err.message || 'Не удалось сохранить');
    } finally {
      setBusyId(null);
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
              <h1 className="acc-title">Мои отклики</h1>
              <p className="acc-subtitle">
                Вакансии, на которые вы откликнулись
              </p>

              <div className="cabinet-tabs" role="tablist" aria-label="Статусы откликов">
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
                    <span className="cabinet-tab__count">{counts[t.key]}</span>
                  </button>
                ))}
              </div>

              {state === 'loading' && (
                <div className="empty-state">
                  <h3>Загружаем отклики…</h3>
                </div>
              )}

              {state === 'error' && (
                <div className="empty-state">
                  <h3>Не удалось загрузить отклики</h3>
                  <p>Попробуйте обновить страницу.</p>
                </div>
              )}

              {state === 'ready' && visible.length === 0 && (
                <div className="empty-state">
                  <h3>{EMPTY[tab]}</h3>
                  {tab === 'pending' && (
                    <>
                      <p>Нажмите «Откликнуться» на вакансии — она появится здесь.</p>
                      <Link className="btn btn--ghost" to="/jobseeker/vacancies">
                        Список вакансий
                      </Link>
                    </>
                  )}
                </div>
              )}

              {state === 'ready' && visible.length > 0 && (
                <div className="cabinet-rows">
                  {visible.map((app) => (
                    <article className="cabinet-row" key={app.id}>
                      <div className="cabinet-row__main">
                        <h3 className="cabinet-row__title">
                          {app.vacancy.full_slug && app.status !== 'blocked' ? (
                            <Link to={`/vacancy/${app.vacancy.full_slug}`}>
                              {app.vacancy.title}
                            </Link>
                          ) : (
                            app.vacancy.title
                          )}
                        </h3>
                        <p className="cabinet-row__meta">
                          {app.vacancy.company && <span>{app.vacancy.company}</span>}
                          {app.vacancy.city && <span>{app.vacancy.city}</span>}
                          <span>{formatDate(app.created_at)}</span>
                        </p>
                        <p className={`acc-status acc-status--${app.status || 'pending'}`}>
                          {statusText(app)}
                        </p>
                      </div>
                      {app.status === 'accepted' && app.start_confirmed && (
                        <div className="cabinet-row__actions">
                          {app.finish_confirmed && (
                            <StubButton className="btn btn--primary">
                              Получить бонус
                            </StubButton>
                          )}
                          {app.finish_reject_kind === 'wont_continue' && (
                            <StubButton className="btn btn--ghost">
                              Пожаловаться
                            </StubButton>
                          )}
                          {!app.finish_confirmed && app.finish_reject_kind === 'incomplete' && (
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => markWork(app, 'finished')}
                            >
                              Завершил работу
                            </button>
                          )}
                          {!app.finish_confirmed && !app.finish_reject_kind && app.work_status === 'finished' && (
                            <WaitingConfirm />
                          )}
                          {!app.finish_confirmed && !app.finish_reject_kind && app.work_status !== 'finished' && (
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => markWork(app, 'finished')}
                            >
                              Завершил работу
                            </button>
                          )}
                        </div>
                      )}
                      {app.status === 'accepted' && !app.start_confirmed && (
                        <div className="cabinet-row__actions">
                          {!app.arrival_confirmed && app.work_status === 'departed' && (
                            <WaitingConfirm />
                          )}
                          {!app.arrival_confirmed && app.work_status !== 'departed' && (
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => markWork(app, 'departed')}
                            >
                              Выехал на работу
                            </button>
                          )}
                          {app.arrival_confirmed && app.work_status !== 'started' && (
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => markWork(app, 'started')}
                            >
                              Вышел на работу
                            </button>
                          )}
                          {app.work_status === 'started' && (
                            <WaitingConfirm />
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

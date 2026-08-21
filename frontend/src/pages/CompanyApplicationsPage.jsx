import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import CompanyCabinetNav from '../components/CompanyCabinetNav';
import DecisionModal from '../components/DecisionModal';
import FinishRejectModal from '../components/FinishRejectModal';
import { confirmApplicationWork, decideApplication, fetchCompanyApplications, rejectApplicationFinish, unblockJobseeker } from '../api/applications.js';
import { formatDate, formatPhone } from '../components/accountFields.jsx';
import { loadSession } from '../lib/auth.js';
import { showToast } from '../lib/toast.js';
import '../../css/account.css';
import '../../css/company.css';

const TABS = [
  { key: 'pending', label: 'Новые' },
  { key: 'accepted', label: 'Принятые' },
  { key: 'arrived', label: 'Приехал на работу' },
  { key: 'working', label: 'Приступил к работе' },
  { key: 'finished', label: 'Завершил работу' },
  { key: 'rejected', label: 'Отказные' },
  { key: 'blocked', label: 'Заблокированные' },
];

const EMPTY = {
  pending: 'Нет новых откликов',
  accepted: 'Нет принятых откликов',
  arrived: 'Нет откликов «Приехал на работу»',
  working: 'Нет откликов «Приступил к работе»',
  finished: 'Нет откликов «Завершил работу»',
  rejected: 'Нет отказных откликов',
  blocked: 'Нет заблокированных откликов',
};

function workStage(app) {
  return app.work_status && app.work_status !== 'none' ? app.work_status : 'none';
}

const COMPANY_STATUS = {
  pending: 'Ожидает решения',
  accepted: 'Принят',
  rejected: 'Отклонён',
  blocked: 'Заблокирован',
};

/* Страница «Отклики» компании: принять / отклонить / заблокировать. */
export default function CompanyApplicationsPage() {
  const data = loadSession();
  const company = data?.companies?.[0] || null;
  const companyId = company?.id;
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('pending');
  const [state, setState] = useState(companyId ? 'loading' : 'ready');
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);

  const lists = useMemo(() => ({
    pending: items.filter((a) => (a.status || 'pending') === 'pending'),
    accepted: items.filter((a) => a.status === 'accepted' && workStage(a) === 'none'),
    arrived: items.filter((a) => a.status === 'accepted' && workStage(a) === 'departed'),
    working: items.filter((a) => a.status === 'accepted' && workStage(a) === 'started'),
    finished: items.filter((a) => a.status === 'accepted' && workStage(a) === 'finished'),
    rejected: items.filter((a) => a.status === 'rejected'),
    blocked: items.filter((a) => a.status === 'blocked'),
  }), [items]);

  const visible = lists[tab] || [];
  const counts = {
    pending: lists.pending.length,
    accepted: lists.accepted.length,
    arrived: lists.arrived.length,
    working: lists.working.length,
    finished: lists.finished.length,
    rejected: lists.rejected.length,
    blocked: lists.blocked.length,
  };

  const load = useCallback(() => {
    if (!companyId) return undefined;
    let alive = true;
    setState('loading');
    fetchCompanyApplications(companyId)
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
  }, [companyId]);

  useEffect(() => load(), [load]);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'legal') {
    return <Navigate to="/account" replace />;
  }

  async function decide(app, action, reason) {
    setBusyId(app.id);
    try {
      await decideApplication(app.id, {
        action,
        reason: reason || null,
        legal_company_id: companyId,
      });
      const messages = {
        accepted: 'Вахтовик принят',
        rejected: 'Отклик отклонён',
        blocked: 'Вахтовик заблокирован',
      };
      showToast(messages[action] || 'Решение сохранено');
      setModal(null);
      load();
    } catch (err) {
      showToast(err.message || 'Не удалось сохранить решение');
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  async function confirmWork(app, action) {
    setBusyId(app.id);
    try {
      await confirmApplicationWork(app.id, {
        action,
        legal_company_id: companyId,
      });
      showToast(action === 'arrival' ? 'Приезд подтверждён' : action === 'start' ? 'Выход на работу подтверждён' : 'Завершение работы подтверждено');
      load();
    } catch (err) {
      showToast(err.message || 'Не удалось подтвердить');
    } finally {
      setBusyId(null);
    }
  }

  async function rejectFinish(app, reason, kind) {
    setBusyId(app.id);
    try {
      await rejectApplicationFinish(app.id, {
        kind,
        reason,
        legal_company_id: companyId,
      });
      showToast(kind === 'incomplete' ? 'Отказано: не до конца доработал' : 'Отказано: не будет дорабатывать');
      setModal(null);
      load();
    } catch (err) {
      showToast(err.message || 'Не удалось отказать');
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  async function unblock(app) {
    setBusyId(app.id);
    try {
      await unblockJobseeker(app.id, companyId);
      showToast('Вахтовик разблокирован, его отклики сняты');
      load();
    } catch (err) {
      showToast(err.message || 'Не удалось разблокировать');
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
            <CompanyCabinetNav company={company} />
            <div className="acc-layout__main">
              <h1 className="acc-title">Отклики</h1>
              <p className="acc-subtitle">
                Вахтовики, которые откликнулись на ваши вакансии
              </p>

              {!company && (
                <div className="empty-state">
                  <h3>Организации не найдены</h3>
                </div>
              )}

              {company && (
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
              )}

              {company && state === 'loading' && (
                <div className="empty-state">
                  <h3>Загружаем отклики…</h3>
                </div>
              )}

              {company && state === 'error' && (
                <div className="empty-state">
                  <h3>Не удалось загрузить отклики</h3>
                  <p>Попробуйте обновить страницу.</p>
                </div>
              )}

              {company && state === 'ready' && visible.length === 0 && (
                <div className="empty-state">
                  <h3>{EMPTY[tab]}</h3>
                  {tab === 'pending' && (
                    <p>Когда вахтовик нажмёт «Откликнуться», заявка появится здесь.</p>
                  )}
                </div>
              )}

              {company && state === 'ready' && visible.length > 0 && (
                <div className="cabinet-rows">
                  {visible.map((app) => (
                    <article className="cabinet-row" key={app.id}>
                      <div className="cabinet-row__main">
                        <h3 className="cabinet-row__title">
                          <Link to={`/company/applications/jobseeker/${app.jobseeker.id}`}>
                            {app.jobseeker.full_name}
                          </Link>
                        </h3>
                        <p className="cabinet-row__meta">
                          <span>{formatPhone(app.jobseeker.phone)}</span>
                          <span>
                            Вакансия:{' '}
                            {app.vacancy.full_slug ? (
                              <Link to={`/vacancy/${app.vacancy.full_slug}`}>
                                {app.vacancy.title}
                              </Link>
                            ) : (
                              app.vacancy.title
                            )}
                          </span>
                          {app.vacancy.city && <span>{app.vacancy.city}</span>}
                          <span>{formatDate(app.created_at)}</span>
                        </p>
                        {app.previously_blocked && (
                          <p className="acc-status acc-status--was-blocked">
                            Этот вахтовик был ранее заблокирован
                            {app.last_block_reason
                              ? `. Причина: ${app.last_block_reason}`
                              : ''}
                          </p>
                        )}
                        {app.work_status === 'departed' && (
                          <p className="acc-status acc-status--accepted">
                            {app.arrival_confirmed
                              ? 'Приезд подтверждён'
                              : 'Вахтовик выехал на работу'}
                          </p>
                        )}
                        {app.work_status === 'started' && (
                          <p className="acc-status acc-status--accepted">
                            {app.start_confirmed
                              ? 'Выход на работу подтверждён'
                              : 'Вахтовик вышел на работу'}
                            {app.finish_reject_kind === 'incomplete' && app.finish_reject_reason
                              ? ` — отказ в завершении: ${app.finish_reject_reason}`
                              : ''}
                          </p>
                        )}
                        {app.work_status === 'finished' && (
                          <p className="acc-status acc-status--accepted">
                            {app.finish_confirmed
                              ? 'Завершение работы подтверждено'
                              : app.finish_reject_kind === 'wont_continue'
                                ? `Отказано: не будет дорабатывать${app.finish_reject_reason ? ` — ${app.finish_reject_reason}` : ''}`
                                : 'Вахтовик завершил работу'}
                          </p>
                        )}
                        {app.status !== 'pending' && workStage(app) === 'none' && (
                          <p className={`acc-status acc-status--${app.status}`}>
                            {COMPANY_STATUS[app.status] || app.status}
                            {app.decision_reason ? ` — ${app.decision_reason}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="cabinet-row__actions">
                        <Link
                          className="btn btn--ghost"
                          to={`/company/applications/jobseeker/${app.jobseeker.id}`}
                        >
                          Профиль
                        </Link>
                        {app.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => decide(app, 'accepted').catch(() => {})}
                            >
                              Принять
                            </button>
                            <button
                              type="button"
                              className="btn btn--reset"
                              disabled={busyId === app.id}
                              onClick={() => setModal({ type: 'rejected', app })}
                            >
                              Отклонить
                            </button>
                            <button
                              type="button"
                              className="btn btn--reset"
                              disabled={busyId === app.id}
                              onClick={() => setModal({ type: 'blocked', app })}
                            >
                              Заблокировать
                            </button>
                          </>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'departed' && !app.arrival_confirmed && (
                          <button
                            type="button"
                            className="btn btn--primary"
                            disabled={busyId === app.id}
                            onClick={() => confirmWork(app, 'arrival')}
                          >
                            Подтвердить приезд
                          </button>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'departed' && app.arrival_confirmed && (
                          <p className="cabinet-row__wait">Приезд подтверждён</p>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'started' && !app.start_confirmed && (
                          <button
                            type="button"
                            className="btn btn--primary"
                            disabled={busyId === app.id}
                            onClick={() => confirmWork(app, 'start')}
                          >
                            Подтвердить выход на работу
                          </button>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'started' && app.start_confirmed && (
                          <p className="cabinet-row__wait">Выход на работу подтверждён</p>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'finished' && !app.finish_confirmed && app.finish_reject_kind !== 'wont_continue' && (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={busyId === app.id}
                              onClick={() => confirmWork(app, 'finish')}
                            >
                              Подтвердить завершение работы
                            </button>
                            <button
                              type="button"
                              className="btn btn--reset"
                              disabled={busyId === app.id}
                              onClick={() => setModal({ type: 'finish-reject', app })}
                            >
                              Отказать в завершении работы
                            </button>
                          </>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'finished' && app.finish_confirmed && (
                          <p className="cabinet-row__wait">Завершение работы подтверждено</p>
                        )}
                        {app.status === 'accepted' && workStage(app) === 'finished' && app.finish_reject_kind === 'wont_continue' && (
                          <p className="cabinet-row__wait">Отказано в завершении работы</p>
                        )}
                        {app.status === 'blocked' && (
                          <button
                            type="button"
                            className="btn btn--primary"
                            disabled={busyId === app.id}
                            onClick={() => unblock(app)}
                          >
                            Разблокировать
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {modal?.type === 'rejected' && (
        <DecisionModal
          title="Отклонить отклик"
          label="Причина отказа"
          submitLabel="Отклонить"
          onClose={() => setModal(null)}
          onSubmit={(reason) => decide(modal.app, 'rejected', reason)}
        />
      )}
      {modal?.type === 'blocked' && (
        <DecisionModal
          title="Заблокировать вахтовика"
          label="Причина блокировки"
          submitLabel="Заблокировать"
          onClose={() => setModal(null)}
          onSubmit={(reason) => decide(modal.app, 'blocked', reason)}
        />
      )}
      {modal?.type === 'finish-reject' && (
        <FinishRejectModal
          onClose={() => setModal(null)}
          onSubmit={(reason, kind) => rejectFinish(modal.app, reason, kind)}
        />
      )}
    </>
  );
}

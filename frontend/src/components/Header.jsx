import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, loadSession, subscribeAuth } from '../lib/auth.js';
import { showToast } from '../lib/toast.js';

const IconSearch = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);

const IconBell = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);

const IconLogout = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

export default function Header({ query, onQueryChange }) {
  const [localQuery, setLocalQuery] = useState(query || '');
  // Сессия: если пользователь авторизован — показываем «Личный кабинет»,
  // иначе — «Войти» со ссылкой на страницу входа.
  const [session, setSession] = useState(() => loadSession());
  const navigate = useNavigate();
  const location = useLocation();
  const live = typeof onQueryChange === 'function';

  useEffect(() => {
    return subscribeAuth(() => setSession(loadSession()));
  }, []);

  useEffect(() => {
    if (live && typeof query === 'string') setLocalQuery(query);
  }, [query, live]);

  /* Выход из аккаунта: кнопка-иконка в шапке, видна только
     авторизованным. Сессия очищается, шапка обновляется через
     подписку; с /account (где сессия обязательна) уходим на главную. */
  function handleLogout() {
    clearSession();
    showToast('Вы вышли из личного кабинета');
    if (location.pathname === '/account') navigate('/');
  }

  function handleChange(e) {
    const value = e.target.value;
    setLocalQuery(value);
    if (live) onQueryChange(value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const q = localQuery.trim();
    if (live) {
      onQueryChange(q);
    } else {
      navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    }
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link className="header__logo" to="/" aria-label="Вахта.ру — на главную">
          <img src="/img/logo.svg" alt="Вахта.ру" />
        </Link>

        <form className="header__search" role="search" onSubmit={handleSubmit}>
          {IconSearch}
          <input
            type="search"
            value={localQuery}
            onChange={handleChange}
            placeholder="Должность, компания или ключевое слово"
            aria-label="Поиск вакансий"
          />
        </form>

        <div className="header__actions">
          <button className="icon-btn" type="button" aria-label="Уведомления">
            {IconBell}
            <span className="icon-btn__badge">3</span>
          </button>
          {session ? (
            <>
              <Link className="login-link" to="/account">Личный кабинет</Link>
              <button
                className="icon-btn"
                type="button"
                aria-label="Выйти"
                title="Выйти"
                onClick={handleLogout}
              >
                {IconLogout}
              </button>
            </>
          ) : (
            <Link className="login-link" to="/login">Войти</Link>
          )}
          {/* Разместить вакансию: организациям (legal) — форма вакансии,
              гостям — регистрация организации. Соискателям (jobseeker)
              кнопка не показывается: размещать вакансии им нельзя. */}
          {session?.user_type !== 'jobseeker' && (
            <Link
              className="btn btn--primary"
              to={session?.user_type === 'legal' ? '/vacancy/new' : '/register-company'}
            >
              Разместить вакансию
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

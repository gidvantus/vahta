import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const IconSearch = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);

const IconBell = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);

export default function Header({ query, onQueryChange }) {
  const [localQuery, setLocalQuery] = useState(query || '');
  const navigate = useNavigate();
  const live = typeof onQueryChange === 'function';

  useEffect(() => {
    if (live && typeof query === 'string') setLocalQuery(query);
  }, [query, live]);

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
          <a className="login-link" href="#">Вход</a>
          <a className="btn btn--primary" href="#">Разместить вакансию</a>
        </div>
      </div>
    </header>
  );
}

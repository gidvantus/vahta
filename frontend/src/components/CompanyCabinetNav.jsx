import { Link, NavLink } from 'react-router-dom';
import { normalizeLogo } from '../lib/format.js';

/* Левая колонка кабинета компании: название, логотип,
   ссылка «Профиль компании» и кнопки вакансий. */
export default function CompanyCabinetNav({ company }) {
  const name = company?.name || 'Организация не найдена';
  const logo = normalizeLogo(company?.logo);
  const initial = (company?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <aside className="acc-layout__side">
      <div className="acc-nav">
        <div className="acc-nav__brand">
          <span className="acc-nav__logo" aria-hidden="true">
            {logo ? (
              <img src={logo} alt="" />
            ) : (
              <span className="acc-nav__logo-fallback">{initial}</span>
            )}
          </span>
          <span className="acc-nav__name">{name}</span>
          <Link className="acc-nav__profile" to="/company/profile">
            Профиль компании
          </Link>
        </div>

        <nav className="acc-nav__actions" aria-label="Работа с вакансиями">
          <NavLink
            className={({ isActive }) =>
              isActive ? 'btn btn--ghost acc-nav__btn is-active' : 'btn btn--ghost acc-nav__btn'
            }
            to="/company/vacancies"
          >
            Список вакансий
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive
                ? 'btn btn--primary acc-nav__btn is-active'
                : 'btn btn--primary acc-nav__btn'
            }
            to="/vacancy/new"
          >
            Создать вакансию
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? 'btn btn--ghost acc-nav__btn is-active' : 'btn btn--ghost acc-nav__btn'
            }
            to="/company/applications"
          >
            Отклики
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}

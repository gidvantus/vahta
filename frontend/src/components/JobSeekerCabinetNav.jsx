import { Link, NavLink } from 'react-router-dom';
import { normalizeLogo } from '../lib/format.js';
import { useJobSeekerFilters } from '../lib/jobseekerFilters.jsx';
import FilterSidebar from './FilterSidebar';

const IconPerson = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 19.2c.8-3.2 3.4-5.2 6.5-5.2s5.7 2 6.5 5.2" />
  </svg>
);

/* Левая колонка кабинета вахтовика: фото, ФИО, ссылка на профиль,
   список вакансий и «Мои отклики», ниже — фильтры как на главной. */
export default function JobSeekerCabinetNav({ person }) {
  const name = person?.full_name || 'Соискатель';
  const photo = normalizeLogo(person?.photo);
  const filters = useJobSeekerFilters();

  return (
    <aside className="acc-layout__side">
      <div className="acc-nav">
        <div className="acc-nav__brand">
          <span className="acc-nav__photo" aria-hidden="true">
            {photo ? (
              <img src={photo} alt="" />
            ) : (
              <span className="acc-nav__photo-fallback">{IconPerson}</span>
            )}
          </span>
          <span className="acc-nav__name">{name}</span>
          <Link className="acc-nav__profile" to="/jobseeker/profile">
            Профиль вахтовика
          </Link>
        </div>

        <nav className="acc-nav__actions" aria-label="Вакансии">
          <NavLink
            className={({ isActive }) =>
              isActive ? 'btn btn--ghost acc-nav__btn is-active' : 'btn btn--ghost acc-nav__btn'
            }
            to="/jobseeker/vacancies"
          >
            Список вакансий
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? 'btn btn--ghost acc-nav__btn is-active' : 'btn btn--ghost acc-nav__btn'
            }
            to="/jobseeker/favorites"
          >
            Избранные вакансии
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? 'btn btn--ghost acc-nav__btn is-active' : 'btn btn--ghost acc-nav__btn'
            }
            to="/jobseeker/applications"
          >
            Мои отклики
          </NavLink>
        </nav>
      </div>
      {filters && (
        <FilterSidebar
          filters={filters.options}
          state={filters.state}
          onCityToggle={filters.toggleCity}
          onSalaryChange={filters.setSalary}
          onScheduleChange={filters.setSchedule}
          onReset={filters.reset}
        />
      )}
    </aside>
  );
}

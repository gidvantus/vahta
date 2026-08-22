import { useMemo, useState } from 'react';

const IconPin = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconMoney = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 21V4h7a5 5 0 0 1 0 10H6M13 14l5 7" /></svg>
);
const IconCalendar = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const IconChevron = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);
const IconX = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
);

/* Сайдбар фильтров. Данные (города, графики, зарплаты со счётчиками)
   приходят с бэкенда: GET /api/v1/filters. */
export default function FilterSidebar({ filters, state, onCityToggle, onSalaryChange, onScheduleChange, onReset }) {
  const [cityQuery, setCityQuery] = useState('');
  const [showAllCities, setShowAllCities] = useState(false);

  const mainCities = useMemo(() => (filters.cities || []).filter((c) => c.is_main), [filters]);
  const extraCities = useMemo(() => (filters.cities || []).filter((c) => !c.is_main), [filters]);

  const q = cityQuery.trim().toLowerCase();
  const visibleMain = mainCities.filter((c) => !q || c.name.toLowerCase().includes(q));
  const visibleExtra = showAllCities ? extraCities.filter((c) => !q || c.name.toLowerCase().includes(q)) : [];

  function cityItem(city) {
    const empty = city.count === 0;
    return (
      <li key={city.name} className={empty ? 'filter-item is-empty' : 'filter-item'}>
        <label>
          <input
            type="checkbox"
            checked={state.cities.has(city.name)}
            onChange={(e) => onCityToggle(city.name, e.target.checked)}
          />
          <span className="filter-item__name">{city.name}</span>
          <span className="filter-item__count">{city.count}</span>
        </label>
      </li>
    );
  }

  return (
    <aside className="filters" aria-label="Фильтры вакансий">
      <div className="filter-groups">

        <section className="filter-group">
          <h2 className="filter-group__title">{IconPin}Город</h2>
          <input
            className="filter-input"
            type="text"
            placeholder="Введите город"
            aria-label="Поиск города"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
          />
          <ul className="filter-list">{visibleMain.map(cityItem)}</ul>
          {!q && extraCities.length > 0 && (
            <>
              <ul className="filter-list">{visibleExtra.map(cityItem)}</ul>
              <button
                className={showAllCities ? 'show-more is-open' : 'show-more'}
                type="button"
                onClick={() => setShowAllCities((v) => !v)}
              >
                <span>{showAllCities ? 'Свернуть' : 'Показать все'}</span>
                {IconChevron}
              </button>
            </>
          )}
        </section>

        <section className="filter-group">
          <h2 className="filter-group__title">{IconMoney}Зарплата</h2>
          <ul className="filter-list">
            {filters.salary?.map((opt) => (
              <li key={opt.value} className="filter-item">
                <label>
                  <input
                    type="radio"
                    name="salary"
                    checked={state.salary === opt.value}
                    onChange={() => onSalaryChange(opt.value)}
                  />
                  <span className="filter-item__name">{opt.label}</span>
                  <span className="filter-item__count">{opt.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="filter-group">
          <h2 className="filter-group__title">{IconCalendar}График вахты</h2>
          <ul className="filter-list">
            {filters.schedules?.map((s) => (
              <li key={s.value} className="filter-item">
                <label>
                  <input
                    type="radio"
                    name="schedule"
                    checked={state.schedule === s.value}
                    onChange={() => onScheduleChange(s.value)}
                  />
                  <span className="filter-item__name">{s.label}</span>
                  <span className="filter-item__count">{s.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

      </div>

      <button className="btn btn--reset filters__reset" type="button" onClick={onReset}>
        {IconX}
        Сбросить фильтры
      </button>
    </aside>
  );
}

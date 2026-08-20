import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchVacancies, fetchFilters } from '../api.js';
import { plural } from '../lib/format.js';
import Header from '../components/Header';
import FilterSidebar from '../components/FilterSidebar';
import SortMenu from '../components/SortMenu';
import VacancyCard from '../components/VacancyCard';

const PAGE_SIZE = 50;

const IconSearch = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);

export default function CatalogPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') || '');
  const [cities, setCities] = useState(() => {
    const c = params.get('city');
    return c ? new Set([c]) : new Set();
  });
  const [salary, setSalary] = useState('any');
  const [schedule, setSchedule] = useState('any');
  const [sort, setSort] = useState('date');

  const [filters, setFilters] = useState({ cities: [], schedules: [], salary: [] });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    document.title = 'Каталог вакансий — Вахта.ру';
  }, []);

  useEffect(() => {
    fetchFilters().then(setFilters).catch(() => setFilters({ cities: [], schedules: [], salary: [] }));
  }, []);

  const state = useMemo(
    () => ({ query, cities, salary, schedule, sort }),
    [query, cities, salary, schedule, sort],
  );

  /* Загрузка первой страницы при изменении фильтров (с дебаунсом для поиска). */
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    const t = setTimeout(() => {
      fetchVacancies(state, 1, PAGE_SIZE)
        .then((r) => {
          if (!alive) return;
          setItems(r.items);
          setTotal(r.total);
          setPage(1);
          setStatus('ready');
        })
        .catch(() => {
          if (alive) setStatus('error');
        });
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [state]);

  function toggleCity(city, checked) {
    setCities((prev) => {
      const next = new Set(prev);
      if (checked) next.add(city);
      else next.delete(city);
      return next;
    });
  }

  function reset() {
    setQuery('');
    setCities(new Set());
    setSalary('any');
    setSchedule('any');
    setSort('date');
  }

  function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    fetchVacancies(state, next, PAGE_SIZE)
      .then((r) => {
        setItems((prev) => [...prev, ...r.items]);
        setTotal(r.total);
        setPage(next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  return (
    <>
      <Header query={query} onQueryChange={setQuery} />
      <div className="layout">
        <FilterSidebar
          filters={filters}
          state={state}
          onCityToggle={toggleCity}
          onSalaryChange={setSalary}
          onScheduleChange={setSchedule}
          onReset={reset}
        />

        <section className="results" aria-label="Список вакансий">
          <div className="results-bar">
            <p className="results-count">
              Найдено <b>{total.toLocaleString('ru-RU')}</b>&nbsp;
              <span>{plural(total, ['вакансия', 'вакансии', 'вакансий'])}</span>
            </p>
            <SortMenu value={sort} onChange={setSort} />
          </div>

          {status === 'loading' && (
            <div className="empty-state">
              {IconSearch}
              <h3>Загружаем вакансии…</h3>
            </div>
          )}

          {status === 'error' && (
            <div className="empty-state">
              {IconSearch}
              <h3>Не удалось загрузить вакансии</h3>
              <p>Проверьте соединение с сервером и обновите страницу.</p>
              <button className="btn btn--ghost" type="button" onClick={() => setStatus('loading') && setTimeout(() => window.location.reload(), 0)}>
                Обновить
              </button>
            </div>
          )}

          {status === 'ready' && items.length === 0 && (
            <div className="empty-state">
              {IconSearch}
              <h3>Ничего не найдено</h3>
              <p>По вашему запросу вакансий нет. Попробуйте изменить фильтры или запрос.</p>
              <button className="btn btn--ghost" type="button" onClick={reset}>Сбросить фильтры</button>
            </div>
          )}

          {status === 'ready' && items.length > 0 && (
            <>
              <div className="vacancy-list">
                {items.map((v) => <VacancyCard key={v.id} vacancy={v} />)}
              </div>
              {items.length < total && (
                <div className="load-more">
                  <button className="btn btn--ghost" type="button" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Загружаем…' : 'Показать ещё'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

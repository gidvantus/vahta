import { useEffect, useState } from 'react';
import { fetchVacancies } from '../api.js';
import { loadSession } from '../lib/auth.js';
import { useFavoriteSet } from '../lib/favorites.js';
import { useJobSeekerFilters, hasActiveFilters } from '../lib/jobseekerFilters.jsx';
import VacancyCard from './VacancyCard';
import VacancyPager, { useCabinetVacancyPageSize } from './VacancyPager';

/* Все опубликованные вакансии всех компаний — центр кабинета вахтовика. */
export default function AllPublishedVacancies() {
  const { state, reset } = useJobSeekerFilters();
  const pageSize = useCabinetVacancyPageSize();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState('loading');
  const { ids: favoriteIds, setFavorite } = useFavoriteSet();

  useEffect(() => {
    setPage(1);
  }, [state, pageSize]);

  useEffect(() => {
    let alive = true;
    setLoadState('loading');
    const jobseekerId = loadSession()?.jobseeker?.id;
    const t = setTimeout(() => {
      fetchVacancies(state, page, pageSize, { jobseekerId })
        .then((r) => {
          if (!alive) return;
          setItems(r.items || []);
          setTotal(r.total || 0);
          setLoadState('ready');
        })
        .catch(() => {
          if (alive) setLoadState('error');
        });
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [state, page, pageSize]);

  function goToPage(next) {
    setPage(next);
    document.querySelector('.acc-published')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loadState === 'loading' && items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Загружаем вакансии…</h3>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="empty-state">
        <h3>Не удалось загрузить вакансии</h3>
        <p>Попробуйте обновить страницу.</p>
      </div>
    );
  }

  if (loadState === 'ready' && total === 0) {
    const filtered = hasActiveFilters(state);
    return (
      <div className="empty-state">
        <h3>{filtered ? 'Ничего не найдено' : 'Нет опубликованных вакансий'}</h3>
        <p>
          {filtered
            ? 'По выбранным фильтрам вакансий нет. Попробуйте сбросить фильтры.'
            : 'Когда компании опубликуют вакансии, они появятся здесь.'}
        </p>
        {filtered && (
          <button className="btn btn--ghost" type="button" onClick={reset}>
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="acc-published" aria-label="Опубликованные вакансии">
      <h2 className="acc-published__title">Опубликованные вакансии</h2>
      <div className="vacancy-list">
        {items.map((v) => (
          <VacancyCard
            key={v.id}
            vacancy={v}
            favorited={favoriteIds.has(v.id)}
            onFavoriteChange={setFavorite}
          />
        ))}
      </div>
      <VacancyPager page={page} total={total} pageSize={pageSize} onChange={goToPage} />
    </section>
  );
}

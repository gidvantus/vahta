import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import JobSeekerCabinetNav from '../components/JobSeekerCabinetNav';
import VacancyCard from '../components/VacancyCard';
import { fetchFavoriteVacancies } from '../api/favorites.js';
import { useFavoriteSet } from '../lib/favorites.js';
import { hasActiveFilters, useJobSeekerFilters, vacancyMatchesFilters } from '../lib/jobseekerFilters.jsx';
import { loadSession } from '../lib/auth.js';
import '../../css/account.css';

/* Кабинет вахтовика: избранные вакансии. */
export default function JobSeekerFavoritesPage() {
  const data = loadSession();
  const jobseekerId = data?.jobseeker?.id;
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState(jobseekerId ? 'loading' : 'ready');
  const { setFavorite } = useFavoriteSet();
  const { state: filterState, reset } = useJobSeekerFilters();
  const visible = useMemo(
    () => items.filter((v) => vacancyMatchesFilters(v, filterState)),
    [items, filterState],
  );

  useEffect(() => {
    if (!jobseekerId) return undefined;
    let alive = true;
    setLoadState('loading');
    fetchFavoriteVacancies(jobseekerId)
      .then((r) => {
        if (!alive) return;
        setItems(r.items || []);
        setLoadState('ready');
      })
      .catch(() => {
        if (alive) setLoadState('error');
      });
    return () => {
      alive = false;
    };
  }, [jobseekerId]);

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'jobseeker') {
    return <Navigate to="/account" replace />;
  }

  function handleFavorite(vacancyId, on) {
    setFavorite(vacancyId, on);
    if (!on) setItems((prev) => prev.filter((v) => v.id !== vacancyId));
  }

  return (
    <>
      <Header />
      <main className="acc-page">
        <div className="acc-container acc-container--wide">
          <div className="acc-layout">
            <JobSeekerCabinetNav person={data.jobseeker} />
            <div className="acc-layout__main">
              <h1 className="acc-title">Избранные вакансии</h1>
              <p className="acc-subtitle">
                Вакансии, которые вы сохранили
              </p>

              {loadState === 'loading' && (
                <div className="empty-state">
                  <h3>Загружаем избранное…</h3>
                </div>
              )}

              {loadState === 'error' && (
                <div className="empty-state">
                  <h3>Не удалось загрузить избранное</h3>
                  <p>Попробуйте обновить страницу.</p>
                </div>
              )}

              {loadState === 'ready' && items.length === 0 && (
                <div className="empty-state">
                  <h3>Пока нет избранных вакансий</h3>
                  <p>Нажмите «В избранное» на вакансии — она появится здесь.</p>
                </div>
              )}

              {loadState === 'ready' && items.length > 0 && visible.length === 0 && (
                <div className="empty-state">
                  <h3>Ничего не найдено</h3>
                  <p>В избранном нет вакансий по выбранным фильтрам.</p>
                  {hasActiveFilters(filterState) && (
                    <button className="btn btn--ghost" type="button" onClick={reset}>
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}

              {loadState === 'ready' && visible.length > 0 && (
                <section className="acc-published" aria-label="Избранные вакансии">
                  <div className="vacancy-list">
                    {visible.map((v) => (
                      <VacancyCard
                        key={v.id}
                        vacancy={v}
                        favorited
                        onFavoriteChange={handleFavorite}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

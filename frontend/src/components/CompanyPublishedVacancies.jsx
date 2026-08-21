import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanyVacancies } from '../api/company.js';
import VacancyCard from './VacancyCard';
import VacancyPager, { useCabinetVacancyPageSize } from './VacancyPager';

/* Опубликованные вакансии компании — центр личного кабинета юрлица.
   Карточки как в каталоге, без кнопки «Откликнуться». */
export default function CompanyPublishedVacancies({ company }) {
  const pageSize = useCabinetVacancyPageSize();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState(company ? 'loading' : 'ready');

  useEffect(() => {
    setPage(1);
  }, [company, pageSize]);

  useEffect(() => {
    if (!company) return undefined;
    let alive = true;
    setState('loading');
    fetchCompanyVacancies(company.id, 'published', page, pageSize)
      .then((r) => {
        if (!alive) return;
        setItems(r.items || []);
        setTotal(r.total || 0);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
    };
  }, [company, page, pageSize]);

  if (!company) {
    return (
      <div className="empty-state">
        <h3>Организации не найдены</h3>
        <p>Зарегистрируйте организацию, чтобы публиковать вакансии.</p>
      </div>
    );
  }

  if (state === 'loading' && items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Загружаем вакансии…</h3>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="empty-state">
        <h3>Не удалось загрузить вакансии</h3>
        <p>Попробуйте обновить страницу.</p>
      </div>
    );
  }

  if (state === 'ready' && total === 0) {
    return (
      <div className="empty-state">
        <h3>Нет опубликованных вакансий</h3>
        <p>Опубликуйте вакансию — она появится здесь и в каталоге.</p>
        <Link className="btn btn--ghost" to="/company/vacancies">Список вакансий</Link>
      </div>
    );
  }

  return (
    <section className="acc-published" aria-label="Опубликованные вакансии">
      <h2 className="acc-published__title">Опубликованные вакансии</h2>
      <div className="vacancy-list">
        {items.map((v) => (
          <VacancyCard key={v.id} vacancy={v} showApply={false} showFavorite={false} />
        ))}
      </div>
      <VacancyPager
        page={page}
        total={total}
        pageSize={pageSize}
        onChange={(next) => {
          setPage(next);
          document.querySelector('.acc-published')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
    </section>
  );
}

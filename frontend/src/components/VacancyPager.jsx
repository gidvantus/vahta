import { useEffect, useState } from 'react';

const ROWS_PER_COLUMN = 5;

/* Сколько карточек на страницу: 5 в каждом столбце сетки кабинета. */
export function useCabinetVacancyPageSize() {
  const [pageSize, setPageSize] = useState(4 * ROWS_PER_COLUMN);

  useEffect(() => {
    const mid = window.matchMedia('(max-width: 1100px)');
    const narrow = window.matchMedia('(max-width: 620px)');

    function update() {
      if (narrow.matches) setPageSize(1 * ROWS_PER_COLUMN);
      else if (mid.matches) setPageSize(2 * ROWS_PER_COLUMN);
      else setPageSize(4 * ROWS_PER_COLUMN);
    }

    update();
    mid.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      mid.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return pageSize;
}

export default function VacancyPager({ page, total, pageSize, onChange }) {
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (pageCount <= 1) return null;

  const numbers = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pageCount, page + 2);
  if (from > 1) numbers.push(1);
  if (from > 2) numbers.push('…');
  for (let n = from; n <= to; n += 1) numbers.push(n);
  if (to < pageCount - 1) numbers.push('…');
  if (to < pageCount) numbers.push(pageCount);

  return (
    <nav className="vacancy-pager" aria-label="Страницы вакансий">
      <button
        type="button"
        className="btn btn--ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Назад
      </button>
      <div className="vacancy-pager__pages">
        {numbers.map((n, i) => (
          n === '…' ? (
            <span key={`e${i}`} className="vacancy-pager__ellipsis">…</span>
          ) : (
            <button
              key={n}
              type="button"
              className={n === page ? 'vacancy-pager__num is-active' : 'vacancy-pager__num'}
              onClick={() => onChange(n)}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          )
        ))}
      </div>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}

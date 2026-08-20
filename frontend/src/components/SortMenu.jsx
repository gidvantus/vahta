import { useEffect, useRef, useState } from 'react';

const SORT_OPTIONS = {
  date: 'По дате',
  'salary-desc': 'По зарплате (сначала выше)',
  'salary-asc': 'По зарплате (сначала ниже)',
};

const IconChevron = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div
      className={open ? 'sort is-open' : 'sort'}
      ref={ref}
      role="button"
      tabIndex="0"
      aria-haspopup="true"
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <span>{SORT_OPTIONS[value]}</span>
      {IconChevron}
      <div className="sort__menu">
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <button
            key={key}
            className={value === key ? 'sort__option is-active' : 'sort__option'}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(key);
              setOpen(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { toggleFavorite } from '../lib/favorites.js';

const IconStarOff = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.6l2.5 5.1 5.6.8-4 3.9.9 5.6L12 16.8 7 19l.9-5.6-4-3.9 5.6-.8L12 3.6z" />
  </svg>
);

const IconStarOn = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.6l2.5 5.1 5.6.8-4 3.9.9 5.6L12 16.8 7 19l.9-5.6-4-3.9 5.6-.8L12 3.6z" />
  </svg>
);

/* Звезда «в избранное» на карточке и на странице вакансии. */
export default function FavoriteButton({ vacancy, favorited, onChange, disabled = false }) {
  const navigate = useNavigate();

  async function handleClick() {
    if (disabled) return;
    const next = await toggleFavorite(vacancy, !!favorited, navigate);
    if (onChange) onChange(next);
  }

  return (
    <button
      type="button"
      className={favorited ? 'btn-fav is-on' : 'btn-fav'}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={!!favorited}
      aria-label={favorited ? 'Убрать из избранного' : 'Добавить в избранное'}
      title={favorited ? 'Убрать из избранного' : 'В избранное'}
    >
      {favorited ? IconStarOn : IconStarOff}
      <span>{favorited ? 'В избранном' : 'В избранное'}</span>
    </button>
  );
}

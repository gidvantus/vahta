import { useEffect, useState } from 'react';
import { addFavorite, fetchFavoriteIds, removeFavorite } from '../api/favorites.js';
import { loadSession } from './auth.js';
import { showToast } from './toast.js';

/* Добавить или убрать вакансию из избранного. Гостя отправляет на вход. */
export async function toggleFavorite(vacancy, currentlyOn, navigate) {
  const session = loadSession();
  if (!session || session.user_type !== 'jobseeker' || !session.jobseeker?.id) {
    showToast('Чтобы добавить в избранное, войдите как вахтовик');
    navigate('/login');
    return currentlyOn;
  }
  if (!vacancy?.id) {
    showToast('Не удалось обновить избранное');
    return currentlyOn;
  }

  try {
    if (currentlyOn) {
      await removeFavorite(vacancy.id, session.jobseeker.id);
      showToast('Вакансия убрана из избранного');
      return false;
    }
    await addFavorite({
      vacancy_id: vacancy.id,
      jobseeker_id: session.jobseeker.id,
    });
    showToast('Вакансия добавлена в избранное');
    return true;
  } catch (err) {
    if (err.status === 409) {
      showToast('Вакансия уже в избранном');
      return true;
    }
    showToast(err.message || 'Не удалось обновить избранное');
    return currentlyOn;
  }
}

export function useFavoriteSet() {
  const [ids, setIds] = useState(() => new Set());
  const jobseekerId = loadSession()?.jobseeker?.id;

  useEffect(() => {
    if (!jobseekerId) return undefined;
    let alive = true;
    fetchFavoriteIds(jobseekerId)
      .then((list) => {
        if (alive) setIds(new Set(list));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [jobseekerId]);

  function setFavorite(vacancyId, on) {
    setIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(vacancyId);
      else next.delete(vacancyId);
      return next;
    });
  }

  return { ids, setFavorite };
}

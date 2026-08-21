import { createApplication } from '../api/applications.js';
import { loadSession } from './auth.js';
import { showToast } from './toast.js';

/* Отклик вахтовика на вакансию. Гостя отправляет на вход;
   юрлицо не может откликаться. Возвращает true, если отклик сохранён
   или уже был отправлен ранее. */
export async function applyToVacancy(vacancy, navigate) {
  const session = loadSession();
  if (!session || session.user_type !== 'jobseeker' || !session.jobseeker?.id) {
    showToast('Чтобы откликнуться, войдите как вахтовик');
    navigate('/login');
    return false;
  }
  if (!vacancy?.id) {
    showToast('Не удалось отправить отклик');
    return false;
  }

  try {
    await createApplication({
      vacancy_id: vacancy.id,
      jobseeker_id: session.jobseeker.id,
    });
    showToast(`Отклик отправлен! Компания <b>${vacancy.company || ''}</b> получила ваше резюме.`);
    return true;
  } catch (err) {
    showToast(err.message || 'Не удалось отправить отклик');
    return false;
  }
}

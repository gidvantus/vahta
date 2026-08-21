import { useEffect } from 'react';
import VacancyView from './VacancyView';

/* Модальное окно предосмотра карточки вакансии (из данных формы). */
export default function PreviewModal({ vacancy, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Предосмотр вакансии"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">Предосмотр вакансии</h2>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Закрыть предосмотр">✕</button>
        </div>
        <div className="modal__body">
          <VacancyView vacancy={vacancy} preview />
        </div>
        <div className="modal__foot">
          <button className="btn btn--primary" type="button" onClick={onClose}>
            Вернуться к форме
          </button>
        </div>
      </div>
    </div>
  );
}

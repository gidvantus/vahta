import { useEffect, useState } from 'react';

/* Отказ в завершении работы: причина + два варианта решения. */
export default function FinishRejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  async function send(kind) {
    const text = reason.trim();
    if (text.length < 3) {
      setError('Укажите причину (не менее 3 символов)');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(text, kind);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--finish"
        role="dialog"
        aria-modal="true"
        aria-label="Отказать в завершении работы"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">Отказать в завершении работы</h2>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal__body">
          {error && <div className="acc-banner" role="alert">{error}</div>}
          <div className="acc-modal__field">
            <label className="acc-modal__label" htmlFor="finish-reject-reason">
              Причина отказа
            </label>
            <textarea
              id="finish-reject-reason"
              className="acc-input"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="modal__foot modal__foot--stack">
          <button
            className="btn btn--reset"
            type="button"
            disabled={submitting}
            onClick={() => send('incomplete')}
          >
            Не до конца доработал
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={submitting}
            onClick={() => send('wont_continue')}
          >
            Не будет дорабатывать
          </button>
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={submitting}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

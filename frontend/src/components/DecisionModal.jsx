import { useEffect, useState } from 'react';

/* Модалка причины отказа или блокировки. */
export default function DecisionModal({
  title,
  label,
  submitLabel,
  onClose,
  onSubmit,
}) {
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

  async function handleSubmit(ev) {
    ev.preventDefault();
    const text = reason.trim();
    if (text.length < 3) {
      setError('Укажите причину (не менее 3 символов)');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(text);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--sm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            {error && <div className="acc-banner" role="alert">{error}</div>}
            <div className="acc-modal__field">
              <label className="acc-modal__label" htmlFor="decision-reason">
                {label}
              </label>
              <textarea
                id="decision-reason"
                className="acc-input"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <div className="modal__foot">
            <button className="btn btn--ghost" type="button" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Сохраняем…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

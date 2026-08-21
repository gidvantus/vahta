import { useEffect, useState } from 'react';
import { changePassword } from '../api/auth.js';
import { isValidPassword } from '../lib/legal.js';
import { showToast } from '../lib/toast.js';

/* Модальное окно смены пароля (личный кабинет, оба типа аккаунтов).

   Два поля: новый пароль и повторение нового пароля. Валидация та же,
   что при регистрации (app/legal.is_valid_password). Текущий пароль
   не запрашивается; после смены сессия не сбрасывается — пользователь
   остаётся в кабинете. Пользователь определяется на сервере по типу
   аккаунта (userType) и телефону (phone). */
export default function ChangePasswordModal({ userType, phone, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
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

  function validate() {
    const e = {};
    if (password.length === 0) {
      e.password = 'Введите новый пароль';
    } else if (!isValidPassword(password)) {
      e.password = password.length < 8
        ? 'Пароль должен содержать не менее 8 символов'
        : 'Пароль должен содержать латинские буквы верхнего и нижнего регистра и цифры';
    }
    if (confirm.length === 0) {
      e.confirm = 'Повторите новый пароль';
    } else if (isValidPassword(password) && confirm !== password) {
      e.confirm = 'Пароли не совпадают';
    }
    return e;
  }

  function touch(name) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    setTouched({ password: true, confirm: true });
    setServerError('');
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword({
        user_type: userType,
        phone,
        password,
        password_confirm: confirm,
      });
      showToast('Пароль изменён');
      onClose();
    } catch (err) {
      setServerError(err.message || 'Не удалось изменить пароль. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--sm"
        role="dialog"
        aria-modal="true"
        aria-label="Смена пароля"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">Смена пароля</h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно смены пароля"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            {serverError && (
              <div className="acc-banner" role="alert">{serverError}</div>
            )}

            <div className="acc-modal__field">
              <label className="acc-modal__label" htmlFor="cp-password">
                Новый пароль
              </label>
              <input
                id="cp-password"
                className="acc-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
              />
              {errors.password && touched.password && (
                <p className="acc-error">{errors.password}</p>
              )}
            </div>

            <div className="acc-modal__field">
              <label className="acc-modal__label" htmlFor="cp-confirm">
                Повтор нового пароля
              </label>
              <input
                id="cp-confirm"
                className="acc-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => touch('confirm')}
              />
              {errors.confirm && touched.confirm && (
                <p className="acc-error">{errors.confirm}</p>
              )}
            </div>
          </div>

          <div className="modal__foot">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Сохраняем…' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

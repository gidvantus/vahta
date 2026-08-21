import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { registerJobSeeker } from '../api/auth.js';
import {
  digitsFromPhoneRaw,
  formatPhoneDigits,
  isValidPassword,
} from '../lib/legal.js';
import { isAuthenticated, saveSession } from '../lib/auth.js';
import { showToast } from '../lib/toast.js';
import '../../css/legal-registration.css';

const CONSENT_TEXT_PART1 = 'Я даю согласие на обработку';
const CONSENT_TEXT_PART2 = 'и принимаю';

const PHONE_MASK_PLACEHOLDER = '+7 (___) ___-__-__';

/* «Регистрация для поиска работы» — отдельная страница для
   физического лица (свой модуль, свой API-слой api/auth.js).
   Валидация полей такая же, как в форме регистрации юридического
   лица. После регистрации пользователь сразу авторизован (сессия
   сохраняется) и переадресуется в личный кабинет /account. */
export default function JobSeekerRegistrationPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [consent, setConsent] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phone = formatPhoneDigits(phoneDigits);

  // Уже авторизован — регистрация недоступна, перенаправляем
  // в личный кабинет (у пользователя уже есть аккаунт).
  if (isAuthenticated()) {
    return <Navigate to="/account" replace />;
  }

  function validate() {
    const e = {};
    if (fullName.trim().length < 2) e.fullName = 'Укажите ФИО';
    if (phoneDigits.length !== 10) e.phone = 'Введите номер полностью: +7 (XXX) XXX-XX-XX';
    if (!isValidPassword(password)) {
      e.password = password.length < 8
        ? 'Пароль должен содержать не менее 8 символов'
        : 'Пароль должен содержать латинские буквы верхнего и нижнего регистра и цифры';
    }
    if (passwordConfirm.length === 0) {
      e.passwordConfirm = 'Повторите пароль';
    } else if (isValidPassword(password) && passwordConfirm !== password) {
      e.passwordConfirm = 'Пароли не совпадают';
    }
    if (!consent) e.consent = 'Необходимо согласие на обработку персональных данных';
    return e;
  }

  function touch(name) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const next = validate();
    setErrors((prev) => ({ ...prev, [name]: next[name] }));
  }

  function handlePhoneChange(value) {
    setPhoneDigits(digitsFromPhoneRaw(value));
  }

  function handleConsentChange(checked) {
    setConsent(checked);
    if (checked) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.consent;
        return next;
      });
    }
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    setServerError('');
    // Показываем ошибки по всем полям после попытки отправки.
    setTouched({
      fullName: true,
      phone: true,
      password: true,
      passwordConfirm: true,
      consent: true,
    });
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // Сервер создаёт профиль и сразу авторизует: ответ — данные
      // личного кабинета, сохраняем их как сессию и идём в /account.
      const account = await registerJobSeeker({
        full_name: fullName.trim(),
        phone,
        password,
        password_confirm: passwordConfirm,
        consent,
      });
      saveSession(account);
      showToast(`Вы зарегистрированы. Добро пожаловать, <b>${account.jobseeker.full_name}</b>!`);
      navigate('/account');
    } catch (err) {
      setServerError(err.message || 'Не удалось выполнить регистрацию. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="reg-page">
        <div className="reg-card">
          <h1 className="reg-title">Регистрация для поиска работы</h1>
          <p className="reg-subtitle">Все поля обязательны для заполнения</p>

          {serverError && <div className="reg-banner" role="alert">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="js-full-name">ФИО</label>
              <input
                id="js-full-name"
                className={`form-input${errors.fullName && touched.fullName ? ' is-invalid' : ''}`}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch('fullName')}
                placeholder="Иванов Иван Иванович"
                autoComplete="name"
              />
              {errors.fullName && touched.fullName && (
                <p className="form-error">{errors.fullName}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="js-phone">Телефон</label>
              <input
                id="js-phone"
                className={`form-input${errors.phone && touched.phone ? ' is-invalid' : ''}`}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => touch('phone')}
                placeholder={PHONE_MASK_PLACEHOLDER}
                autoComplete="tel"
              />
              {errors.phone && touched.phone && (
                <p className="form-error">{errors.phone}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="js-password">Пароль</label>
              <input
                id="js-password"
                className={`form-input${errors.password && touched.password ? ' is-invalid' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
              />
              {errors.password && touched.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="js-password-confirm">Повтор пароля</label>
              <input
                id="js-password-confirm"
                className={`form-input${errors.passwordConfirm && touched.passwordConfirm ? ' is-invalid' : ''}`}
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onBlur={() => touch('passwordConfirm')}
                placeholder="Повторите пароль"
                autoComplete="new-password"
              />
              {errors.passwordConfirm && touched.passwordConfirm && (
                <p className="form-error">{errors.passwordConfirm}</p>
              )}
            </div>

            <div className="form-field form-consent">
              <label className={`form-checkbox${errors.consent && touched.consent ? ' is-invalid' : ''}`}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => handleConsentChange(e.target.checked)}
                  onBlur={() => touch('consent')}
                />
                <span>
                  {CONSENT_TEXT_PART1}{' '}
                  <Link to="/privacy">персональных данных</Link>{' '}
                  {CONSENT_TEXT_PART2}{' '}
                  <Link to="/offer">пользовательское соглашение</Link>
                </span>
              </label>
              {errors.consent && touched.consent && (
                <p className="form-error">{errors.consent}</p>
              )}
            </div>

            <button className="btn btn--primary form-submit" type="submit" disabled={submitting}>
              {submitting ? 'Регистрируем…' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { loginUser } from '../api/auth.js';
import { digitsFromPhoneRaw, formatPhoneDigits } from '../lib/legal.js';
import { isAuthenticated, saveSession } from '../lib/auth.js';
import { showToast } from '../lib/toast.js';
import '../../css/login.css';

const PHONE_MASK_PLACEHOLDER = '+7 (___) ___-__-__';

/* У каждого типа аккаунта свой личный кабинет: физическое лицо
   («Регистрация для поиска работы») и юридическое лицо (работодатель).
   Тип выбирается на этой странице и передаётся на сервер (user_type). */
const ACCOUNT_TYPES = [
  { value: 'jobseeker', label: 'Физическое лицо — ищу работу' },
  { value: 'legal', label: 'Юридическое лицо — размещаю вакансии' },
];

/* Страница входа — отдельная от остальных страниц (свой модуль,
   свой API-слой api/auth.js, свои стили css/login.css). При успехе
   авторизации сохраняет сессию и переадресует на /account, где
   показываются данные, указанные при регистрации. */
export default function LoginPage() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState('legal');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phone = formatPhoneDigits(phoneDigits);

  // Уже авторизован — незачем входить повторно.
  if (isAuthenticated()) {
    return <Navigate to="/account" replace />;
  }

  function validate() {
    const e = {};
    if (phoneDigits.length !== 10) {
      e.phone = 'Введите номер полностью: +7 (XXX) XXX-XX-XX';
    }
    if (password.length === 0) e.password = 'Введите пароль';
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

  async function handleSubmit(ev) {
    ev.preventDefault();
    const next = validate();
    setErrors(next);
    setServerError('');
    // Показываем ошибки по всем полям после попытки отправки.
    setTouched({ phone: true, password: true });
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // Сервер ищет пользователя по телефону и сверяет пароль с базой.
      const account = await loginUser({ user_type: userType, phone, password });
      saveSession(account);
      const name = account.user_type === 'jobseeker'
        ? account.jobseeker.full_name
        : account.registrant.full_name;
      showToast(`Добро пожаловать, <b>${name}</b>`);
      navigate('/account');
    } catch (err) {
      // Ошибки авторизации (пользователь не найден, неверный пароль и т.п.)
      // показываем на странице, кнопка в шапке остаётся «Войти».
      setServerError(err.message || 'Не удалось выполнить вход. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      <main className="login-page">
        <div className="login-card">
          <h1 className="login-title">Вход в личный кабинет</h1>
          <p className="login-subtitle">Телефон и пароль, указанные при регистрации</p>

          {serverError && <div className="login-banner" role="alert">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="login-type">
              <legend className="login-type__legend">Кто вы?</legend>
              {ACCOUNT_TYPES.map((t) => (
                <label className="login-type__option" key={t.value}>
                  <input
                    type="radio"
                    name="user-type"
                    value={t.value}
                    checked={userType === t.value}
                    onChange={() => setUserType(t.value)}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="login-field">
              <label className="login-label" htmlFor="login-phone">Телефон</label>
              <input
                id="login-phone"
                className={`login-input${errors.phone && touched.phone ? ' is-invalid' : ''}`}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => touch('phone')}
                placeholder={PHONE_MASK_PLACEHOLDER}
                autoComplete="tel"
              />
              {errors.phone && touched.phone && (
                <p className="login-error">{errors.phone}</p>
              )}
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-password">Пароль</label>
              <input
                id="login-password"
                className={`login-input${errors.password && touched.password ? ' is-invalid' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Пароль от личного кабинета"
                autoComplete="current-password"
              />
              {errors.password && touched.password && (
                <p className="login-error">{errors.password}</p>
              )}
            </div>

            <button className="btn btn--primary login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="login-register">
            Нет аккаунта?{' '}
            <Link to="/register-jobseeker">Регистрация для поиска работы</Link>
            {' · '}
            <Link to="/register-company">Регистрация организации</Link>
          </p>
        </div>
      </main>
    </>
  );
}

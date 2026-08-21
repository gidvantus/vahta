import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { registerLegalCompany } from '../api/legal.js';
import {
  digitsFromPhoneRaw,
  formatPhoneDigits,
  isValidInn10,
  isValidPassword,
} from '../lib/legal.js';
import { showToast } from '../lib/toast.js';
import '../../css/legal-registration.css';

const CONSENT_TEXT_PART1 = 'Я даю согласие на обработку';
const CONSENT_TEXT_PART2 = 'и принимаю';

const PHONE_MASK_PLACEHOLDER = '+7 (___) ___-__-__';

export default function LegalRegistrationPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [inn, setInn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [consent, setConsent] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phone = formatPhoneDigits(phoneDigits);

  function validate() {
    const e = {};
    if (fullName.trim().length < 2) e.fullName = 'Укажите ФИО';
    if (phoneDigits.length !== 10) e.phone = 'Введите номер полностью: +7 (XXX) XXX-XX-XX';
    if (!isValidInn10(inn)) {
      e.inn = inn.length !== 10
        ? 'ИНН должен содержать ровно 10 цифр'
        : 'ИНН не прошёл проверку контрольной суммы';
    }
    if (companyName.trim().length < 2) e.companyName = 'Укажите название организации';
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

  function handleInnChange(value) {
    setInn(value.replace(/\D+/g, '').slice(0, 10));
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
      inn: true,
      companyName: true,
      password: true,
      passwordConfirm: true,
      consent: true,
    });
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const result = await registerLegalCompany({
        full_name: fullName.trim(),
        phone,
        inn,
        company_name: companyName.trim(),
        password,
        password_confirm: passwordConfirm,
        consent,
      });
      showToast(`Организация <b>${result.company_name}</b> успешно зарегистрирована`);
      navigate('/');
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
          <h1 className="reg-title">Регистрация юридического лица</h1>
          <p className="reg-subtitle">Все поля обязательны для заполнения</p>

          {serverError && <div className="reg-banner" role="alert">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-full-name">ФИО</label>
              <input
                id="reg-full-name"
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
              <label className="form-label" htmlFor="reg-phone">Телефон</label>
              <input
                id="reg-phone"
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
              <label className="form-label" htmlFor="reg-inn">ИНН</label>
              <input
                id="reg-inn"
                className={`form-input${errors.inn && touched.inn ? ' is-invalid' : ''}`}
                type="text"
                inputMode="numeric"
                value={inn}
                onChange={(e) => handleInnChange(e.target.value)}
                onBlur={() => touch('inn')}
                placeholder="10 цифр"
                autoComplete="off"
              />
              {errors.inn && touched.inn && (
                <p className="form-error">{errors.inn}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="reg-company">Название организации</label>
              <input
                id="reg-company"
                className={`form-input${errors.companyName && touched.companyName ? ' is-invalid' : ''}`}
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => touch('companyName')}
                placeholder="ООО «Компания»"
                autoComplete="organization"
              />
              {errors.companyName && touched.companyName && (
                <p className="form-error">{errors.companyName}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="reg-password">Пароль</label>
              <input
                id="reg-password"
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
              <label className="form-label" htmlFor="reg-password-confirm">Повтор пароля</label>
              <input
                id="reg-password-confirm"
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
              {submitting ? 'Регистрируем…' : 'Зарегистрировать'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

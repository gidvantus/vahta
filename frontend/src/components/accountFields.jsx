import { formatPhoneDigits } from '../lib/legal.js';

/* Телефон из базы хранится в каноническом виде +7XXXXXXXXXX —
   показываем в маске +7 (XXX) XXX-XX-XX как в форме регистрации. */
export function formatPhone(canonical) {
  if (!canonical) return '';
  const digits = canonical.replace(/\D+/g, '');
  return formatPhoneDigits(digits.length === 11 ? digits.slice(1) : digits);
}

/* Дата регистрации (UTC) — в виде «21 августа 2026 г.». */
export function formatDate(iso) {
  if (!iso) return '';
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(hasTz ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* Дата рождения: сервер отдаёт ISO «2026-08-21», показываем ДД.ММ.ГГГГ. */
export function isoToRuDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/* Возраст полных лет по дате рождения (ISO YYYY-MM-DD). */
export function ageFromBirthDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return '';
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 130) return '';
  return String(age);
}

/* Одна строка «метка — значение» (только чтение). */
export function Field({ label, value }) {
  return (
    <div className="acc-field">
      <dt className="acc-field__label">{label}</dt>
      <dd className="acc-field__value">{value}</dd>
    </div>
  );
}

/* Редактируемое поле: подпись + контрол. */
export function EditField({ label, required = false, children }) {
  return (
    <div className="acc-field">
      <span className="acc-field__label">
        {label}
        {required && <span className="acc-field__req" aria-hidden="true">*</span>}
      </span>
      <div className="acc-field__control">{children}</div>
    </div>
  );
}

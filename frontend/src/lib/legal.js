/* Утилиты формы регистрации юридического лица (отдельный модуль —
   не пересекается с логикой каталога вакансий: lib/query.js, lib/format.js). */

/* Веса контрольной суммы ИНН юрлица (первые 9 разрядов). */
const INN_WEIGHTS = [2, 4, 10, 3, 5, 9, 4, 6, 8];

/* Проверка пароля: не менее 8 символов, латинские буквы верхнего
   и нижнего регистра и хотя бы одна цифра. */
export function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/* Проверка ИНН юрлица: ровно 10 цифр + контрольная сумма. */
export function isValidInn10(inn) {
  if (!/^\d{10}$/.test(inn)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(inn[i]) * INN_WEIGHTS[i];
  return sum % 11 % 10 === Number(inn[9]);
}

/* Маска телефона +7 (XXX) XXX-XX-XX.
   На вход — только цифры номера без префикса (до 10 цифр).
   Пример: "9123456789" → "+7 (912) 345-67-89".
   Пустой номер → "", чтобы поле можно было полностью очистить
   (плейсхолдер показывает маску). */
export function formatPhoneDigits(digits) {
  if (digits.length === 0) return '';
  let out = '+7';
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ')';
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

/* Извлекает цифры номера из введённого значения поля с маской.

   В поле всегда присутствует префикс "+7": при удалении фрагмента
   или правке середины номера цифра префикса "7" попадает в выборку
   и портит номер — поэтому, если строка начинается с "+", первая
   цифра (префикс) отбрасывается. Вставка целиком без "+"
   ("7912…"/"8912…", 11 цифр) тоже сбрасывает первую цифру. */
export function digitsFromPhoneRaw(value) {
  let digits = value.replace(/\D+/g, '');
  if (value.trimStart().startsWith('+') && digits.length > 0 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  } else if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

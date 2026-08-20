/* Утилиты форматирования (чистые функции, тестируются в node). */

export function fmtSalary(from, to) {
  if (from == null && to == null) return 'Зарплата не указана';
  const n = (v) => (v == null ? '' : v.toLocaleString('ru-RU'));
  if (from != null && to != null) return `${n(from)} – ${n(to)} ₽`;
  if (from != null) return `от ${n(from)} ₽`;
  return `до ${n(to)} ₽`;
}

export function plural(n, forms) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

/* Относительная дата публикации: «Сегодня», «Вчера», «N дней назад». */
export function dateLabel(iso) {
  if (!iso) return '';
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(hasTz ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/* Нормализация логотипа из API: относительный путь → с ведущим слэшем;
   внешние URL — как есть. */
export function normalizeLogo(logo) {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  return `/${logo.replace(/^\/+/, '')}`;
}

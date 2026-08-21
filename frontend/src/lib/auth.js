/* Сессия авторизации (отдельный модуль).
   После успешного входа сервер возвращает данные личного кабинета —
   сохраняем их в localStorage, чтобы шапка и /account знали
   о текущем пользователе. Пароль в сессию не попадает: сервер
   отдаёт только данные, указанные при регистрации. */

const STORAGE_KEY = 'vahta.session';
const listeners = new Set();

/* Подписка на изменение сессии (для Header и страниц).
   Возвращает функцию отписки — вызывайте в useEffect. */
export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyAuthChanged() {
  for (const listener of listeners) listener();
}

/* Сохраняет сессию после успешного входа. */
export function saveSession(account) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    /* localStorage недоступен (приватный режим и т.п.) — входа нет */
  }
  notifyAuthChanged();
}

/* Текущая сессия (данные пользователя и его организаций) или null. */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* Завершает сессию (выход из личного кабинета). */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage недоступен — чистить нечего */
  }
  notifyAuthChanged();
}

/* Признак авторизации: есть ли сохранённая сессия. */
export function isAuthenticated() {
  return loadSession() !== null;
}

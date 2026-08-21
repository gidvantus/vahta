/* Отдельный слой API авторизации.
   Не связан с каталогом вакансий (api.js) и с регистрацией
   (api/legal.js): только вход по телефону и паролю. */

const API_BASE = '/api/v1';

/* Вход по телефону и паролю. При успехе сервер возвращает данные
   личного кабинета — те же, что пользователь указал при регистрации
   (регистратор + организации), пароль в ответ не попадает.
   При ошибке — 401/422 с сообщением из detail, которое показываем
   пользователю. */
export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Не удалось выполнить вход. Попробуйте ещё раз.';
    try {
      const data = await res.json();
      if (data && typeof data.detail === 'string') detail = data.detail;
    } catch {
      /* ответ не JSON — оставляем общее сообщение */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

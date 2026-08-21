/* Отдельный слой API регистрации юридического лица.
   Не связан с каталогом вакансий (см. api.js). */

const API_BASE = '/api/v1';

/* Регистрация юридического лица.
   При совпадении уникальных ключей (телефон/ИНН) сервер отвечает 409 —
   сообщение из detail показываем пользователю. */
export async function registerLegalCompany(payload) {
  const res = await fetch(`${API_BASE}/legal-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Не удалось выполнить регистрацию. Попробуйте ещё раз.';
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

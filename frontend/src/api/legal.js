/* Отдельный слой API регистрации юридического лица.
   Не связан с каталогом вакансий (см. api.js). */

const API_BASE = '/api/v1';

/* Общая обработка ответа: при ошибке бросаем Error с текстом из detail. */
async function handle(res) {
  if (!res.ok) {
    let detail = 'Не удалось выполнить запрос. Попробуйте ещё раз.';
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

/* Регистрация юридического лица.
   При совпадении уникальных ключей (телефон/ИНН) сервер отвечает 409 —
   сообщение из detail показываем пользователю. */
export async function registerLegalCompany(payload) {
  const res = await fetch(`${API_BASE}/legal-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Редактирование данных регистратора (личный кабинет): ФИО и телефон.
   Согласие на обработку ПД сервером не меняется. Телефон — уникальный
   ключ: при совпадении с чужим номером сервер отвечает 409. */
export async function updateLegalRegistrant(registrantId, payload) {
  const res = await fetch(`${API_BASE}/legal-registration/registrant/${registrantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Редактирование данных организации (личный кабинет): название и ИНН.
   ИНН — уникальный ключ: при совпадении с чужим значением — 409. */
export async function updateLegalCompany(companyId, payload) {
  const res = await fetch(`${API_BASE}/legal-registration/companies/${companyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

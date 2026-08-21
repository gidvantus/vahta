/* Отдельный слой API авторизации и регистрации соискателя.
   Не связан с каталогом вакансий (api.js) и с регистрацией
   юридического лица (api/legal.js): только вход по телефону
   и паролю и «Регистрация для поиска работы» (физлицо). */

const API_BASE = '/api/v1';

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

/* Вход по телефону и паролю. При успехе сервер возвращает данные
   личного кабинета — те же, что пользователь указал при регистрации
   (для legal: регистратор + организации; для jobseeker: данные
   физического лица), пароль в ответ не попадает.
   При ошибке — 401/422 с сообщением из detail. */
export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* «Регистрация для поиска работы» (физлицо): создаёт профиль и сразу
   авторизует — ответ в той же форме, что и loginUser (данные личного
   кабинета). Фронт сохраняет его как сессию и ведёт в /account. */
export async function registerJobSeeker(payload) {
  const res = await fetch(`${API_BASE}/jobseekers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Редактирование данных соискателя (личный кабинет): ФИО и телефон.
   Согласие на обработку ПД сервером не меняется. Телефон — уникальный
   ключ: при совпадении с чужим номером сервер отвечает 409. */
export async function updateJobSeeker(jobseekerId, payload) {
  const res = await fetch(`${API_BASE}/jobseekers/${jobseekerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Смена пароля (личный кабинет, модальное окно). Текущий пароль
   не требуется; сессия после смены не сбрасывается. Валидация
   нового пароля — та же, что при регистрации. */
export async function changePassword(payload) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

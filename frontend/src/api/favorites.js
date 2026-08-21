const API_BASE = '/api/v1';

async function handle(res) {
  if (!res.ok) {
    let detail = 'Не удалось выполнить запрос. Попробуйте ещё раз.';
    try {
      const data = await res.json();
      if (data && typeof data.detail === 'string') detail = data.detail;
    } catch {
      /* ответ не JSON */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function fetchFavoriteVacancies(jobseekerId) {
  const params = new URLSearchParams({ jobseeker_id: String(jobseekerId) });
  return fetch(`${API_BASE}/favorites?${params}`).then(handle);
}

export function fetchFavoriteIds(jobseekerId) {
  const params = new URLSearchParams({ jobseeker_id: String(jobseekerId) });
  return fetch(`${API_BASE}/favorites/ids?${params}`)
    .then(handle)
    .then((data) => data?.ids || []);
}

export async function addFavorite(payload) {
  const res = await fetch(`${API_BASE}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function removeFavorite(vacancyId, jobseekerId) {
  const params = new URLSearchParams({
    vacancy_id: String(vacancyId),
    jobseeker_id: String(jobseekerId),
  });
  const res = await fetch(`${API_BASE}/favorites?${params}`, { method: 'DELETE' });
  return handle(res);
}

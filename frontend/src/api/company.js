/* Слой API страницы «Список вакансий» компании.

   ПРЕДПОЛАГАЕМЫЙ КОНТРАКТ личного кабинета компании (согласуется со
   вторым программистом — при появлении реального API достаточно
   поправить пути/параметры здесь):
     GET   /api/v1/vacancies?legal_company_id=<id>&status=draft|published|archived
     PATCH /api/v1/vacancies/{id}/status  {"status": "draft|published|archived"}
*/

const API_BASE = '/api/v1';

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await apiError(res));
  return res.json();
}

/* Текстовое описание ошибки API (detail из FastAPI). */
async function apiError(res) {
  let detail = null;
  try {
    const j = await res.json();
    detail = j.detail;
  } catch {
    /* не JSON — оставляем null */
  }
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'string' ? d : d.msg))
      .filter(Boolean)
      .join('; ');
  }
  return `Ошибка API: ${res.status}`;
}

/* Вакансии организации по вкладке статуса. */
export function fetchCompanyVacancies(legalCompanyId, status, page = 1, pageSize = 100) {
  const params = new URLSearchParams({
    legal_company_id: String(legalCompanyId),
    page: String(page),
    page_size: String(pageSize),
  });
  if (status) params.set('status', status);
  return getJSON(`${API_BASE}/vacancies?${params}`);
}

/* Смена статуса вакансии: draft | published | archived. */
export async function updateVacancyStatus(id, status) {
  const res = await fetch(`${API_BASE}/vacancies/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await apiError(res));
  return res.json();
}

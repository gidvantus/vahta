/* Слой работы с API бэкенда (FastAPI). Запросы идут через nginx: /api/v1/* */

import { buildQueryParams } from './lib/query.js';

const API_BASE = '/api/v1';
const DEFAULT_PAGE_SIZE = 50;

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

/* Список вакансий с фильтрами и пагинацией. */
export function fetchVacancies(state, page = 1, pageSize = DEFAULT_PAGE_SIZE, extra = {}) {
  const params = new URLSearchParams();
  const p = buildQueryParams(state);
  for (const [k, v] of Object.entries(p)) params.set(k, String(v));
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  if (extra.jobseekerId) params.set('jobseeker_id', String(extra.jobseekerId));
  return getJSON(`${API_BASE}/vacancies?${params}`);
}

/* Карточка вакансии по id. */
export function fetchVacancy(id) {
  return getJSON(`${API_BASE}/vacancies/${id}`);
}

/* Создание вакансии из данных формы. Возвращает созданную вакансию. */
export async function createVacancy(data) {
  const res = await fetch(`${API_BASE}/vacancies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await apiError(res));
  return res.json();
}

/* Загрузка фото (multipart). Возвращает { paths: [...] } — пути к файлам. */
export async function uploadPhotos(files) {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await apiError(res));
  return res.json();
}

/* Данные сайдбара фильтров: города, графики, зарплаты со счётчиками. */
export function fetchFilters() {
  return getJSON(`${API_BASE}/filters`);
}

/* Детальная карточка вакансии по slug (транслит названия). */
export function fetchVacancyBySlug(slug, extra = {}) {
  const params = extra.jobseekerId
    ? `?jobseeker_id=${encodeURIComponent(extra.jobseekerId)}`
    : '';
  return getJSON(`${API_BASE}/vacancies/slug/${encodeURIComponent(slug)}${params}`);
}

/* Справочники: города и компании (для формы создания вакансии). */
export function fetchCities() {
  return getJSON(`${API_BASE}/cities`);
}

export function fetchCompanies() {
  return getJSON(`${API_BASE}/companies`);
}

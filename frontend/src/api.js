/* Слой работы с API бэкенда (FastAPI). Запросы идут через nginx: /api/v1/* */

import { buildQueryParams } from './lib/query.js';

const API_BASE = '/api/v1';
const DEFAULT_PAGE_SIZE = 50;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
  return res.json();
}

/* Список вакансий с фильтрами и пагинацией. */
export function fetchVacancies(state, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const params = new URLSearchParams();
  const p = buildQueryParams(state);
  for (const [k, v] of Object.entries(p)) params.set(k, String(v));
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return getJSON(`${API_BASE}/vacancies?${params}`);
}

/* Данные сайдбара фильтров: города, графики, зарплаты со счётчиками. */
export function fetchFilters() {
  return getJSON(`${API_BASE}/filters`);
}

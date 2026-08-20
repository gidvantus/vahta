/* Построение параметров запроса API из состояния фильтров (чистая функция). */

export const SALARY_MIN = { '100k': 100000, '150k': 150000, '200k': 200000 };

export function buildQueryParams(state) {
  const p = {};
  const q = (state.query || '').trim();
  if (q) p.q = q;
  if (state.cities && state.cities.size) p.cities = [...state.cities].join(',');
  if (state.salary === 'specified') {
    p.salary_specified = true;
  } else if (state.salary && state.salary !== 'any') {
    p.salary_min = SALARY_MIN[state.salary];
  }
  if (state.schedule && state.schedule !== 'any') p.schedule = state.schedule;
  if (state.sort && state.sort !== 'date') p.sort = state.sort;
  return p;
}

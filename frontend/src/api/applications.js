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
  return res.json();
}

/* Отклик вахтовика на вакансию. */
export async function createApplication(payload) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Отклики организации (кабинет компании). */
export function fetchCompanyApplications(legalCompanyId) {
  const params = new URLSearchParams({
    legal_company_id: String(legalCompanyId),
  });
  return fetch(`${API_BASE}/applications?${params}`).then(handle);
}

/* Отклики вахтовика (кабинет «Мои отклики»). */
export function fetchJobSeekerApplications(jobseekerId) {
  const params = new URLSearchParams({
    jobseeker_id: String(jobseekerId),
  });
  return fetch(`${API_BASE}/applications?${params}`).then(handle);
}

/* Решение работодателя: accepted | rejected | blocked. */
export async function decideApplication(applicationId, payload) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/decision`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

/* Снять блокировку: вакансии снова видны, отклики компании удаляются. */
export async function unblockJobseeker(applicationId, legalCompanyId) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/unblock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legal_company_id: legalCompanyId }),
  });
  return handle(res);
}

/* Профиль вахтовика для компании — только если есть отклик. */
export function fetchApplicantProfile(jobseekerId, legalCompanyId) {
  const params = new URLSearchParams({
    legal_company_id: String(legalCompanyId),
  });
  return fetch(`${API_BASE}/jobseekers/${jobseekerId}?${params}`).then(handle);
}

export async function setApplicationWork(applicationId, payload) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/work`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function confirmApplicationWork(applicationId, payload) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/work-confirm`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function rejectApplicationFinish(applicationId, payload) {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/finish-reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

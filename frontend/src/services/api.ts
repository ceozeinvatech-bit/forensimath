const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
  let res: Response
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  } catch (err: any) {
    throw new Error(`Network error contacting ${url}: ${err?.message || String(err)}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // include status and body when available
    throw new Error(`${res.status} ${res.statusText} - ${text || 'no response body'}`)
  }

  try {
    return await res.json()
  } catch (err: any) {
    // if JSON parse fails, return raw text
    const text = await res.text().catch(() => '')
    return text
  }
}

export const api = {
  health: () => request('/health'),
  getCases: () => request('/cases'),
  createCase: (payload: any) => request('/cases', { method: 'POST', body: JSON.stringify(payload) }),
  getCase: (caseId: string) => request(`/cases/${caseId}`),
  updateCase: (caseId: string, payload: any) => request(`/cases/${caseId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCase: (caseId: string) => request(`/cases/${caseId}`, { method: 'DELETE' }),

  listEvidence: (caseId: string) => request(`/cases/${caseId}/evidence`),
  createEvidence: (caseId: string, payload: any) => request(`/cases/${caseId}/evidence`, { method: 'POST', body: JSON.stringify(payload) }),
  updateEvidence: (caseId: string, evidenceId: string, payload: any) => request(`/cases/${caseId}/evidence/${evidenceId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEvidence: (caseId: string, evidenceId: string) => request(`/cases/${caseId}/evidence/${evidenceId}`, { method: 'DELETE' }),

  listScenarios: (caseId: string) => request(`/cases/${caseId}/scenarios`),
  createScenario: (caseId: string, payload: any) => request(`/cases/${caseId}/scenarios`, { method: 'POST', body: JSON.stringify(payload) }),
  autoGenerateScenarios: (caseId: string) => request(`/cases/${caseId}/scenarios/autogen`, { method: 'POST' }),
  explainScenario: (caseId: string, scenarioId: string) => request(`/cases/${caseId}/scenarios/${scenarioId}/explain`, { method: 'POST' }),
  generateScenarioInsights: (caseId: string, scenarioId: string) => request(`/cases/${caseId}/scenarios/${scenarioId}/insights`, { method: 'POST' }),
  evaluateScenario: (caseId: string, scenarioId: string) => request(`/cases/${caseId}/scenarios/${scenarioId}/evaluate`, { method: 'POST' }),
  resetScenario: (caseId: string, scenarioId: string) => request(`/cases/${caseId}/scenarios/${scenarioId}/reset`, { method: 'POST' }),
  evaluateAllScenarios: (caseId: string) => request(`/cases/${caseId}/scenarios/evaluateAll`, { method: 'POST' }),

  runAnalysis: (caseId: string) => request(`/cases/${caseId}/analysis/run`, { method: 'POST' }),
  getCalculations: (caseId: string) => request(`/cases/${caseId}/calculations`),
  getAnalysisState: (caseId: string) => request(`/cases/${caseId}/analysis`),
  reconstruction: (caseId: string) => request(`/cases/${caseId}/reconstruction`, { method: 'POST' }),
  summary: (caseId: string) => request(`/cases/${caseId}/summary`, { method: 'POST' }),
}

export default api

const API_BASE = 'https://auditqit-0-eight.vercel.app';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchAPI('/api/auth/callback/credentials', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Audits
  startAudit: (url: string) =>
    fetchAPI('/api/audit/start', { method: 'POST', body: JSON.stringify({ url }) }),

  startGitHubAudit: (url: string) =>
    fetchAPI('/api/github-audit/start', { method: 'POST', body: JSON.stringify({ url }) }),

  getAuditStatus: (id: string) =>
    fetchAPI(`/api/audit/${id}/status`),

  getAuditReport: (id: string) =>
    fetchAPI(`/api/audit/${id}/report`),

  getRecentAudits: () =>
    fetchAPI('/api/audit/recent'),

  deleteAudit: (id: string) =>
    fetchAPI(`/api/audit/${id}/delete`, { method: 'DELETE' }),

  getAuditHistory: (url: string) =>
    fetchAPI(`/api/audit/history?url=${encodeURIComponent(url)}`),

  // Monitors
  getMonitors: () =>
    fetchAPI('/api/monitors'),

  createMonitor: (data: { url: string; name: string; frequency: string }) =>
    fetchAPI('/api/monitors', { method: 'POST', body: JSON.stringify(data) }),

  // Chat
  chat: (auditId: string, message: string, history: { role: string; content: string }[]) =>
    fetchAPI(`/api/report/${auditId}/chat`, { method: 'POST', body: JSON.stringify({ message, history }) }),

  // Leaderboard
  getLeaderboard: () =>
    fetchAPI('/api/leaderboard'),
};

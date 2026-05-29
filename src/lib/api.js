const BASE_URL = '';
const SESSION_HEADER = 'X-Hermes-Session-Token';

export async function fetchJSON(url, options = {}) {
  const token = localStorage.getItem('hermes_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers[SESSION_HEADER] = token;
  }

  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = token ? `${url}${separator}token=${encodeURIComponent(token)}` : url;

  const response = await fetch(`${BASE_URL}${finalUrl}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

export const api = {
  // Observability
  getStatus: () => fetchJSON('/api/status'),
  getLogs: (file, lines = 100) => fetchJSON(`/api/logs?file=${file}&lines=${lines}`),
  
  // Config
  getConfig: () => fetchJSON('/api/config'),
  getConfigSchema: () => fetchJSON('/api/config/schema'),
  saveConfig: (config) => fetchJSON('/api/config', { method: 'PUT', body: JSON.stringify({ config }) }),
  
  // Environments & Keys
  getEnvVars: () => fetchJSON('/api/env'),
  setEnvVar: (key, value) => fetchJSON('/api/env', { method: 'PUT', body: JSON.stringify({ key, value }) }),
  deleteEnvVar: (key) => fetchJSON('/api/env', { method: 'DELETE', body: JSON.stringify({ key }) }),
  revealEnvVar: (key) => fetchJSON('/api/env/reveal', { method: 'POST', body: JSON.stringify({ key }) }),
  
  // Analytics
  getAnalytics: (days = 30) => fetchJSON(`/api/analytics/usage?days=${days}`),
  getModelsAnalytics: (days = 30) => fetchJSON(`/api/analytics/models?days=${days}`),
  
  // Sessions
  getSessions: (limit = 20, offset = 0) => fetchJSON(`/api/sessions?limit=${limit}&offset=${offset}`),
  getSessionMessages: (id) => fetchJSON(`/api/sessions/${encodeURIComponent(id)}/messages`),
  searchSessions: (q) => fetchJSON(`/api/sessions/search?q=${encodeURIComponent(q)}`),
  
  // Cron
  getCronJobs: () => fetchJSON('/api/cron/jobs'),
  createCronJob: (job) => fetchJSON('/api/cron/jobs', { method: 'POST', body: JSON.stringify(job) }),
  pauseCronJob: (id) => fetchJSON(`/api/cron/jobs/${id}/pause`, { method: 'POST' }),
  resumeCronJob: (id) => fetchJSON(`/api/cron/jobs/${id}/resume`, { method: 'POST' }),
  triggerCronJob: (id) => fetchJSON(`/api/cron/jobs/${id}/trigger`, { method: 'POST' }),
  
  // Skills & Plugins
  getSkills: () => fetchJSON('/api/skills'),
  toggleSkill: (name, enabled) => fetchJSON('/api/skills/toggle', { method: 'PUT', body: JSON.stringify({ name, enabled }) }),
  getPluginsHub: () => fetchJSON('/api/dashboard/plugins/hub'),
  installAgentPlugin: (identifier, enable = true) => fetchJSON('/api/dashboard/agent-plugins/install', { method: 'POST', body: JSON.stringify({ identifier, enable }) }),
  removeAgentPlugin: (name) => fetchJSON(`/api/dashboard/agent-plugins/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  updateAgentPlugin: (name) => fetchJSON(`/api/dashboard/agent-plugins/${encodeURIComponent(name)}/update`, { method: 'POST' }),
  
  // System Actions
  restartGateway: () => fetchJSON('/api/gateway/restart', { method: 'POST' }),
  updateHermes: () => fetchJSON('/api/hermes/update', { method: 'POST' }),
  getActionStatus: (name, lines = 200) => fetchJSON(`/api/actions/${encodeURIComponent(name)}/status?lines=${lines}`),

  // Profiles
  getProfiles: () => fetchJSON('/api/profiles'),
  useProfile: (name) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}/use`, { method: 'POST' }),
  createProfile: (name, cloneFromDefault = true) => fetchJSON('/api/profiles', { method: 'POST', body: JSON.stringify({ name, clone_from_default: cloneFromDefault }) }),
  renameProfile: (name, newName) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}`, { method: 'PATCH', body: JSON.stringify({ new_name: newName }) }),
  deleteProfile: (name) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  getProfileSoul: (name) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}/soul`),
  updateProfileSoul: (name, content) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}/soul`, { method: 'PUT', body: JSON.stringify({ content }) }),
  getProfileSetupCommand: (name) => fetchJSON(`/api/profiles/${encodeURIComponent(name)}/setup-command`),
  
  // Commands
  getCommands: () => fetchJSON('/api/dashboard/commands'),

  // Documentation
  getDocTopics: () => fetchJSON('/api/docs/topics'),
  getDocContent: (path) => fetchJSON(`/api/docs/content/${encodeURIComponent(path)}`),
  searchDocs: (q) => fetchJSON(`/api/docs/search?q=${encodeURIComponent(q)}`),
  getDocsSkills: () => fetchJSON('/api/docs/skills'),
  getUserStories: () => fetchJSON('/api/docs/user-stories'),

  // 9Router Bridge
  get9RouterStats: (period = '7d') => fetchJSON(`/api/9router/usage/stats?period=${period}`),
  get9RouterChart: (period = '7d') => fetchJSON(`/api/9router/usage/chart?period=${period}`),
  get9RouterKeys: () => fetchJSON('/api/9router/keys'),
  get9RouterSettings: () => fetchJSON('/api/9router/settings'),
  get9RouterProviders: () => fetchJSON('/api/9router/providers'),

  // Node Graph
  getGraph: () => fetchJSON('/api/graph'),
};

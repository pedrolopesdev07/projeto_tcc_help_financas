const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function getAuthHeaders() {
  const accessToken = localStorage.getItem('helpfinance_accessToken');
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  const body = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body
  });

  if (response.status === 204) {
    return {} as T;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Erro de comunicação com o servidor.');
  }

  return payload;
}

export async function login(email: string, password: string) {
  return request('/api/auth/login', { method: 'POST', body: { email, senha: password } });
}

export async function register(name: string, email: string, password: string) {
  return request('/api/auth/register', { method: 'POST', body: { nome: name, email, senha: password } });
}

export async function logout(refreshToken: string) {
  return request('/api/auth/logout', { method: 'POST', body: { refreshToken } });
}

export async function getMe() {
  return request('/api/users/me');
}

export async function updateMe(data: { nome?: string; renda_mensal?: number; estrategia_financeira?: string; config_estrategia?: object }) {
  return request('/api/users/me', { method: 'PUT', body: data });
}

export async function deleteMe() {
  return request('/api/users/me', { method: 'DELETE' });
}

export async function onboarding(payload: { objetivo_principal: string; perfil_consumidor: string; dependentes: number; config_estrategia?: object }) {
  return request('/api/users/onboarding', { method: 'POST', body: payload });
}

export async function fetchTransactions() {
  return request('/api/transactions');
}

export async function createTransaction(payload: { tipo: string; valor: number; descricao: string; data: string; categoria_id?: string | null; categoria_key?: string; recorrencia: string }) {
  return request('/api/transactions', { method: 'POST', body: payload });
}

export async function deleteTransaction(id: string) {
  return request(`/api/transactions/${id}`, { method: 'DELETE' });
}

export async function fetchGoals() {
  return request('/api/goals');
}

export async function createGoal(payload: { nome: string; tipo_meta: string; valor_total: number; valor_atual: number; data_limite: string }) {
  return request('/api/goals', { method: 'POST', body: payload });
}

export async function updateGoal(id: string, payload: { valor_atual?: number; nome?: string; tipo_meta?: string; valor_total?: number; data_limite?: string; status?: string }) {
  return request(`/api/goals/${id}`, { method: 'PUT', body: payload });
}

export async function deleteGoal(id: string) {
  return request(`/api/goals/${id}`, { method: 'DELETE' });
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('helpfinance_accessToken', accessToken);
  localStorage.setItem('helpfinance_refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('helpfinance_accessToken');
  localStorage.removeItem('helpfinance_refreshToken');
}

export function getRefreshToken() {
  return localStorage.getItem('helpfinance_refreshToken');
}

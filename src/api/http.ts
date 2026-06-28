const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ts_pwa_token');
}

export function setToken(token: string): void {
  localStorage.setItem('ts_pwa_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('ts_pwa_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    localStorage.removeItem('ts_pwa_auth');
    location.hash = '#/login';
    throw new Error('Sesi berakhir, silakan masuk kembali.');
  }

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

import { setToken, removeToken } from './api/http';

const AUTH_KEY = 'ts_pwa_auth';

export async function login(username: string, password: string): Promise<boolean> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  setToken(data.token);
  localStorage.setItem(AUTH_KEY, 'true');
  return true;
}

export function logout(): void {
  removeToken();
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true' && !!localStorage.getItem('ts_pwa_token');
}

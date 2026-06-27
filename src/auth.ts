const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123';

const AUTH_KEY = 'ts_pwa_auth';

export function login(username: string, password: string): boolean {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

type PageFn = (params: Record<string, string>) => string;
type RouteDef = { pattern: RegExp; keys: string[]; fn: PageFn };

const routes: RouteDef[] = [];

export function route(pattern: string, fn: PageFn): void {
  // Convert '/anggota/edit/:id' → { pattern: /^\/anggota\/edit\/([^/]+)$/, keys: ['id'] }
  const keys: string[] = [];
  const regexStr = pattern.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ pattern: new RegExp(`^${regexStr}$`), keys, fn });
}

function parseParams(route: RouteDef, path: string): Record<string, string> {
  const m = path.match(route.pattern);
  if (!m) return {};
  const params: Record<string, string> = {};
  route.keys.forEach((key, i) => { params[key] = m[i + 1] || ''; });
  return params;
}

function render(): void {
  const hash = location.hash.slice(1) || '/dashboard';
  const path = hash.split('?')[0];
  const matched = routes.find(r => r.pattern.test(path));
  const app = document.querySelector<HTMLDivElement>('#app')!;

  if (!matched) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">🔗</div><div class="empty-title">Halaman Tidak Ditemukan</div><div class="empty-text">Rute <code>${esc(path)}</code> tidak ada.</div></div>`;
    return;
  }

  const params = parseParams(matched, path);
  // Parse query string into params
  const query = new URLSearchParams(hash.split('?')[1] ?? '');
  query.forEach((v, k) => { params[k] = v; });

  try {
    const html = matched.fn(params);
    app.innerHTML = html;
    app.classList.remove('page-enter');
    void app.offsetWidth; // trigger reflow
    app.classList.add('page-enter');
  } catch (err) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error</div><div class="empty-text">${esc((err as Error).message)}</div></div>`;
  }
}

export function navigate(hash: string): void {
  location.hash = hash;
}

export function initRouter(): void {
  window.addEventListener('hashchange', render);
  render();
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

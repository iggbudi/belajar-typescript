type PageFn = () => string;

const routes = new Map<string, PageFn>();

export function route(path: string, fn: PageFn): void {
  routes.set(path, fn);
}

function render(): void {
  const hash = location.hash.slice(1) || '/dashboard';
  const path = hash.split('?')[0];
  const fn = routes.get(path);
  const app = document.querySelector<HTMLDivElement>('#app')!;
  if (fn) app.innerHTML = fn();
}

export function navigate(hash: string): void {
  location.hash = hash;
}

export function initRouter(): void {
  window.addEventListener('hashchange', render);
  render();
}

import './style.css';
import { route, initRouter, navigate } from './router';
import { isAuthenticated } from './auth';
import { loginPage, mountLogin } from './pages/login';
import { dashboardPage, mountDashboard } from './pages/dashboard';
import { anggotaListPage, mountAnggotaList } from './pages/anggota/list';
import { anggotaFormPage, mountAnggotaForm } from './pages/anggota/form';

function renderNav(): string {
  if (!isAuthenticated()) return '';
  const hash = location.hash.slice(1) || '/dashboard';
  return `
    <nav class="bottom-nav">
      <button class="nav-item ${hash === '/dashboard' ? 'active' : ''}" id="nav-home">
        <span class="nav-icon">🏠</span>
        <span>Home</span>
      </button>
      <button class="nav-item ${hash === '/anggota' || hash.startsWith('/anggota/') ? 'active' : ''}" id="nav-anggota">
        <span class="nav-icon">👥</span>
        <span>Anggota</span>
      </button>
    </nav>
  `;
}

function mountNav(): void {
  document.querySelector<HTMLButtonElement>('#nav-home')
    ?.addEventListener('click', () => navigate('/dashboard'));
  document.querySelector<HTMLButtonElement>('#nav-anggota')
    ?.addEventListener('click', () => navigate('/anggota'));
}

function guard(page: () => string, mount?: () => void): () => string {
  return () => {
    if (!isAuthenticated()) { navigate('/login'); return ''; }
    const html = page();
    setTimeout(() => {
      mount?.();
      mountNav();
    }, 0);
    return html;
  };
}

// ── Routes (guarded) ──
route('/login', () => {
  if (isAuthenticated()) { navigate('/dashboard'); return ''; }
  setTimeout(() => mountLogin(), 0);
  return loginPage();
});

route('/dashboard', guard(dashboardPage, mountDashboard));
route('/anggota', guard(anggotaListPage, mountAnggotaList));
route('/anggota/tambah', guard(() => anggotaFormPage(false), mountAnggotaForm));

route('/anggota/edit', guard(
  () => anggotaFormPage(true),
  mountAnggotaForm
));

// ── Init ──
const originalInitRouter = initRouter;
const patchedInitRouter = () => {
  originalInitRouter();
  // Inject nav after initial render
  setTimeout(() => {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    const nav = renderNav();
    if (nav) {
      app.insertAdjacentHTML('afterend', nav);
      mountNav();
    }
  }, 0);
};

// Override window hashchange to include nav update
window.addEventListener('hashchange', () => {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const nav = renderNav();
  const oldNav = document.querySelector('.bottom-nav');
  if (oldNav) oldNav.remove();
  if (nav) {
    app.insertAdjacentHTML('afterend', nav);
    mountNav();
  }
});

patchedInitRouter();

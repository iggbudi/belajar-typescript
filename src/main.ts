import './style.css';
import { route, initRouter, navigate } from './router';
import { isAuthenticated } from './auth';
import { loginPage, mountLogin } from './pages/login';
import { dashboardPage, mountDashboard } from './pages/dashboard';
import { anggotaListPage, mountAnggotaList, unmountAnggotaList } from './pages/anggota/list';
import { anggotaFormPage, mountAnggotaForm } from './pages/anggota/form';
import { kegiatanListPage, mountKegiatanList } from './pages/kegiatan/list';
import { kegiatanFormPage, mountKegiatanForm } from './pages/kegiatan/form';
import { absensiPage, mountAbsensiPage } from './pages/kegiatan/absensi';
import { consumeFlashToast, updateNavBadge } from './ui';
import { getAnggota } from './api/anggota';
import { getStatsKegiatan } from './api/kegiatan';

let previousRoute = '';

function renderNav(): string {
  if (!isAuthenticated()) return '';
  const hash = location.hash.slice(1) || '/dashboard';
  
  const isAnggotaActive = hash === '/anggota' || hash.startsWith('/anggota/');
  const isKegiatanActive = hash === '/kegiatan' || hash.startsWith('/kegiatan/');
  
  return `
    <nav class="bottom-nav">
      <button class="nav-item ${hash === '/dashboard' ? 'active' : ''}" id="nav-home">
        <span class="nav-icon">🏠</span>
        <span>Beranda</span>
      </button>
      <button class="nav-item ${isAnggotaActive ? 'active' : ''}" id="nav-anggota">
        <span class="nav-icon">👥</span>
        <span>Anggota</span>
        <span class="nav-badge hidden" id="nav-badge-anggota">0</span>
      </button>
      <button class="nav-item ${isKegiatanActive ? 'active' : ''}" id="nav-kegiatan">
        <span class="nav-icon">📋</span>
        <span>Kegiatan</span>
        <span class="nav-badge hidden" id="nav-badge-kegiatan">0</span>
      </button>
    </nav>
  `;
}

function mountNav(): void {
  document.querySelector<HTMLButtonElement>('#nav-home')
    ?.addEventListener('click', () => navigate('/dashboard'));
  document.querySelector<HTMLButtonElement>('#nav-anggota')
    ?.addEventListener('click', () => navigate('/anggota'));
  document.querySelector<HTMLButtonElement>('#nav-kegiatan')
    ?.addEventListener('click', () => navigate('/kegiatan'));

  // Load badge counts
  loadBadgeCounts();
}

async function loadBadgeCounts(): Promise<void> {
  try {
    const [anggota, stats] = await Promise.all([
      getAnggota(),
      getStatsKegiatan()
    ]);
    updateNavBadge(anggota.length, 'anggota');
    updateNavBadge(stats.total, 'kegiatan');
  } catch {
    // Silent fail for badges
  }
}

function guard(page: () => string, mount?: () => void, unmount?: () => void): () => string {
  return () => {
    if (!isAuthenticated()) { navigate('/login'); return ''; }

    // Unmount previous page if needed
    if (unmount) unmount();

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

// Anggota routes
route('/anggota', guard(anggotaListPage, mountAnggotaList, unmountAnggotaList));
route('/anggota/tambah', guard(() => anggotaFormPage(false), mountAnggotaForm));
route('/anggota/edit', guard(() => anggotaFormPage(true), mountAnggotaForm));

// Kegiatan routes
route('/kegiatan', guard(kegiatanListPage, mountKegiatanList));
route('/kegiatan/tambah', guard(() => kegiatanFormPage(false), mountKegiatanForm));
route('/kegiatan/edit', guard(() => kegiatanFormPage(true), mountKegiatanForm));
route('/kegiatan/absensi', guard(absensiPage, mountAbsensiPage));

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
    consumeFlashToast();
  }, 0);
};

// Override window hashchange to include nav update
window.addEventListener('hashchange', () => {
  // Unmount previous page
  const currentHash = location.hash.slice(1) || '/dashboard';
  if (previousRoute === '/anggota' && !currentHash.startsWith('/anggota')) {
    unmountAnggotaList();
  }
  previousRoute = currentHash;

  const app = document.querySelector<HTMLDivElement>('#app')!;
  const nav = renderNav();
  const oldNav = document.querySelector('.bottom-nav');
  if (oldNav) oldNav.remove();
  if (nav) {
    app.insertAdjacentHTML('afterend', nav);
    mountNav();
  }
  setTimeout(() => consumeFlashToast(), 0);
});

patchedInitRouter();

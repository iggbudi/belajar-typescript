import './style.css';
import { route, initRouter, navigate } from './router';
import { isAuthenticated } from './auth';
import { loginPage, mountLogin } from './pages/login';
import { dashboardPage, mountDashboard, unmountDashboard } from './pages/dashboard';
import { anggotaListPage, mountAnggotaList, unmountAnggotaList } from './pages/anggota/list';
import { anggotaFormPage, mountAnggotaForm } from './pages/anggota/form';
import { kegiatanListPage, mountKegiatanList, unmountKegiatanList } from './pages/kegiatan/list';
import { kegiatanFormPage, mountKegiatanForm } from './pages/kegiatan/form';
import { absensiPage, mountAbsensiPage } from './pages/kegiatan/absensi';
import { settingsPage, mountSettings } from './pages/settings';
import { consumeFlashToast, updateNavBadge, onBadgeInvalidate, initOfflineIndicator, initUnsavedGuard } from './ui';
import { getAnggota } from './api/anggota';
import { getStatsKegiatan } from './api/kegiatan';

let currentUnmount: (() => void) | null = null;

// Badge cache
let badgeCache: { anggota: number; kegiatan: number; ts: number } | null = null;
const BADGE_TTL = 60_000; // 1 min

export function invalidateBadgeCache(): void { badgeCache = null; }

// Register invalidation for other modules
onBadgeInvalidate(() => { badgeCache = null; });

// Init offline indicator
initOfflineIndicator();
initUnsavedGuard();

function updateNavActive(): void {
  const hash = location.hash.slice(1) || '/dashboard';
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (hash === '/dashboard') document.querySelector('#nav-home')?.classList.add('active');
  else if (hash === '/anggota' || hash.startsWith('/anggota/')) document.querySelector('#nav-anggota')?.classList.add('active');
  else if (hash === '/kegiatan' || hash.startsWith('/kegiatan/')) document.querySelector('#nav-kegiatan')?.classList.add('active');
  else if (hash === '/settings') document.querySelector('#nav-settings')?.classList.add('active');
}

function createNav(): void {
  if (!isAuthenticated()) return;
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const existing = document.querySelector('.bottom-nav');
  if (existing) return; // already created
  app.insertAdjacentHTML('afterend', `
    <nav class="bottom-nav">
      <button class="nav-item" id="nav-home">
        <span class="nav-icon">🏠</span>
        <span>Beranda</span>
      </button>
      <button class="nav-item" id="nav-anggota">
        <span class="nav-icon">👥</span>
        <span>Anggota</span>
        <span class="nav-badge hidden" id="nav-badge-anggota">0</span>
      </button>
      <button class="nav-item" id="nav-kegiatan">
        <span class="nav-icon">📋</span>
        <span>Kegiatan</span>
        <span class="nav-badge hidden" id="nav-badge-kegiatan">0</span>
      </button>
      <button class="nav-item" id="nav-settings">
        <span class="nav-icon">⚙️</span>
        <span>Setting</span>
      </button>
    </nav>
  `);
  document.querySelector<HTMLButtonElement>('#nav-home')?.addEventListener('click', () => navigate('/dashboard'));
  document.querySelector<HTMLButtonElement>('#nav-anggota')?.addEventListener('click', () => navigate('/anggota'));
  document.querySelector<HTMLButtonElement>('#nav-kegiatan')?.addEventListener('click', () => navigate('/kegiatan'));
  document.querySelector<HTMLButtonElement>('#nav-settings')?.addEventListener('click', () => navigate('/settings'));
  updateNavActive();
  loadBadgeCounts();
}

function removeNav(): void {
  document.querySelector('.bottom-nav')?.remove();
}

async function loadBadgeCounts(): Promise<void> {
  if (badgeCache && Date.now() - badgeCache.ts < BADGE_TTL) {
    updateNavBadge(badgeCache.anggota, 'anggota');
    updateNavBadge(badgeCache.kegiatan, 'kegiatan');
    return;
  }
  try {
    const [anggota, stats] = await Promise.all([
      getAnggota(),
      getStatsKegiatan()
    ]);
    badgeCache = { anggota: anggota.length, kegiatan: stats.total, ts: Date.now() };
    updateNavBadge(anggota.length, 'anggota');
    updateNavBadge(stats.total, 'kegiatan');
  } catch {
    // Silent fail for badges
  }
}

function guard(pageFn: (params: Record<string, string>) => string, mount?: () => void, unmount?: () => void): (params: Record<string, string>) => string {
  return (params) => {
    if (!isAuthenticated()) { navigate('/login'); return ''; }

    // Unmount previous page (stored from last route)
    currentUnmount?.();
    currentUnmount = unmount ?? null;

    const html = pageFn(params);
    setTimeout(() => {
      mount?.();
      updateNavActive();
      loadBadgeCounts();
    }, 0);
    return html;
  };
}

// ── Routes (guarded) ──
route('/login', () => {
  if (isAuthenticated()) { navigate('/dashboard'); return ''; }
  removeNav();
  setTimeout(() => mountLogin(), 0);
  return loginPage();
});

route('/dashboard', guard(dashboardPage, mountDashboard, unmountDashboard));

// Anggota routes
route('/anggota', guard(() => anggotaListPage(), mountAnggotaList, unmountAnggotaList));
route('/anggota/tambah', guard(() => anggotaFormPage(false), mountAnggotaForm));
route('/anggota/edit/:id', guard((p) => anggotaFormPage(true, p.id), mountAnggotaForm));

// Kegiatan routes
route('/kegiatan', guard(() => kegiatanListPage(), mountKegiatanList, unmountKegiatanList));
route('/kegiatan/tambah', guard(() => kegiatanFormPage(false), mountKegiatanForm));
route('/kegiatan/edit/:id', guard((p) => kegiatanFormPage(true, p.id), mountKegiatanForm));
route('/kegiatan/absensi/:id', guard((p) => absensiPage(p.id), mountAbsensiPage));

// Settings route
route('/settings', guard(settingsPage, mountSettings));

// ── Init ──
const originalInitRouter = initRouter;
const patchedInitRouter = () => {
  originalInitRouter();
  setTimeout(() => {
    createNav();
    consumeFlashToast();
  }, 0);
};

// Update nav active state on hashchange
window.addEventListener('hashchange', () => {
  updateNavActive();
  setTimeout(() => consumeFlashToast(), 0);
});

patchedInitRouter();

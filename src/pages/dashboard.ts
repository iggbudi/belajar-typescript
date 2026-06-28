import { apiGet } from '../api/http';
import { skeletonStats, getGreeting, initPullToRefresh } from '../ui';

interface Stats {
  totalAnggota: number;
  total: number;
  bulanIni: number;
  totalHadir: number;
}

let cleanupPull: (() => void) | null = null;

export function dashboardPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">Beranda</p>
          <h1>Selamat datang</h1>
        </div>
      </div>
    </header>

    <section class="greeting-section">
      <div class="greeting-text" id="greeting-text">${getGreeting()}, 👋</div>
      <p class="greeting-sub">Kelola data PKK dengan mudah</p>
    </section>

    <section class="stats-grid" id="stats-container">
      ${skeletonStats()}
    </section>
  `;
}

export function mountDashboard(): void {
  cleanupPull?.();
  loadDashboardData();

  const container = document.querySelector<HTMLDivElement>('#stats-container')!;
  cleanupPull = initPullToRefresh({
    container,
    onRefresh: loadDashboardData,
  });
}

export function unmountDashboard(): void {
  cleanupPull?.();
  cleanupPull = null;
}

async function loadDashboardData(): Promise<void> {
  try {
    const stats = await apiGet<Stats>('/stats');
    renderStats(stats);
  } catch (e) {
    const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;
    statsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Gagal Memuat Data</div>
        <div class="empty-text">Periksa koneksi internet lalu coba lagi.</div>
        <p class="error" style="margin:0;font-size:.82rem"><small>${(e as Error).message}</small></p>
      </div>
    `;
  }
}

function renderStats(stats: Stats): void {
  const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${stats.totalAnggota}</div>
      <div class="stat-label">Total Anggota</div>
    </div>
    <div class="stats-row">
      <div class="stat-card-secondary">
        <div class="stat-icon">📅</div>
        <div class="stat-number">${stats.total}</div>
        <div class="stat-label">Total Kegiatan</div>
      </div>
      <div class="stat-card-secondary">
        <div class="stat-icon">📋</div>
        <div class="stat-number">${stats.bulanIni}</div>
        <div class="stat-label">Kegiatan Bulan Ini</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card-secondary">
        <div class="stat-icon">✅</div>
        <div class="stat-number">${stats.totalHadir}</div>
        <div class="stat-label">Total Kehadiran</div>
      </div>
      <div class="stat-card-secondary">
        <div class="stat-icon">📊</div>
        <div class="stat-number">${stats.totalAnggota > 0 ? Math.round(stats.totalHadir / Math.max(stats.total, 1) * 100) : 0}%</div>
        <div class="stat-label">Rata-rata Hadir</div>
      </div>
    </div>
  `;
}

import { logout } from '../auth';
import { navigate } from '../router';
import { getAnggota, type Anggota } from '../api/anggota';
import { getStatsKegiatan } from '../api/kegiatan';
import { skeletonStats, getGreeting } from '../ui';

export function dashboardPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">Beranda</p>
          <h1>Selamat datang</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">🚪 Keluar</button>
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
  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });

  loadDashboardData();
}

async function loadDashboardData(): Promise<void> {
  try {
    const [data, statsKegiatan] = await Promise.all([
      getAnggota(),
      getStatsKegiatan()
    ]);

    renderStats(data, statsKegiatan);
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

function renderStats(data: Anggota[], statsKegiatan: { total: number; bulanIni: number; totalHadir: number }): void {
  const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;
  const total = data.length;
  const withPhone = data.filter(a => a.no_telepon && a.no_telepon.trim()).length;
  const withoutPhone = total - withPhone;

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${total}</div>
      <div class="stat-label">Total Anggota</div>
    </div>
    <div class="stats-row">
      <div class="stat-card-secondary">
        <div class="stat-icon">📅</div>
        <div class="stat-number">${statsKegiatan.total}</div>
        <div class="stat-label">Total Kegiatan</div>
      </div>
      <div class="stat-card-secondary">
        <div class="stat-icon">📋</div>
        <div class="stat-number">${statsKegiatan.bulanIni}</div>
        <div class="stat-label">Kegiatan Bulan Ini</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card-secondary">
        <div class="stat-icon">📱</div>
        <div class="stat-number">${withPhone}</div>
        <div class="stat-label">Ada Telepon</div>
      </div>
      <div class="stat-card-secondary">
        <div class="stat-icon">📵</div>
        <div class="stat-number">${withoutPhone}</div>
        <div class="stat-label">Belum Lengkap</div>
      </div>
    </div>
  `;
}

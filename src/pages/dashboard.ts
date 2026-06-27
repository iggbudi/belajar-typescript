import { logout } from '../auth';
import { navigate } from '../router';
import { getAnggota } from '../api/anggota';

export function dashboardPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">Beranda</p>
          <h1>Selamat datang</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">Keluar</button>
      </div>
    </header>

    <section class="hero-card">
      <h2>Kelola data PKK dengan mudah</h2>
      <p>Tambah anggota baru, lihat daftar anggota, dan pastikan data tetap rapi.</p>
      <div class="quick-actions">
        <button id="btn-tambah-dashboard" class="btn-primary">+ Tambah Anggota</button>
        <button id="btn-lihat-anggota" class="btn-secondary">Lihat Daftar</button>
      </div>
    </section>

    <section class="card">
      <h2>Statistik</h2>
      <div id="stats-container" class="stats-grid">
        <p class="loading">Memuat data anggota...</p>
      </div>
    </section>
  `;
}

export function mountDashboard(): void {
  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });

  document.querySelector<HTMLButtonElement>('#btn-tambah-dashboard')
    ?.addEventListener('click', () => navigate('/anggota/tambah'));

  document.querySelector<HTMLButtonElement>('#btn-lihat-anggota')
    ?.addEventListener('click', () => navigate('/anggota'));

  loadDashboardData();
}

async function loadDashboardData(): Promise<void> {
  try {
    const data = await getAnggota();

    // Render stats
    const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${data.length}</div>
        <div class="stat-label">Total Anggota Terdata</div>
      </div>
    `;
  } catch (e) {
    const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;
    statsContainer.innerHTML = `<p class="error">Data belum bisa dimuat. Periksa koneksi internet lalu coba lagi.<br><small>${(e as Error).message}</small></p>`;
  }
}

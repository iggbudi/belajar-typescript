import { logout } from '../auth';
import { navigate } from '../router';
import { getAnggota } from '../api/anggota';

export function dashboardPage(): string {
  return `
    <header>
      <div class="header-row">
        <h1>Aplikasi Kegiatan PKK</h1>
        <button id="logout-btn" class="icon-btn" title="Logout">🚪</button>
      </div>
      <p>Kelola kegiatan dan anggota PKK</p>
    </header>

    <section class="card">
      <h2>Statistik</h2>
      <div id="stats-container" class="stats-grid">
        <p class="loading">Memuat data...</p>
      </div>
    </section>

    <section class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="margin: 0;">Anggota Terbaru</h2>
        <button id="btn-lihat-semua" class="btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Lihat Semua</button>
      </div>
      <div id="anggota-preview" class="anggota-preview">
        <p class="loading">Memuat data...</p>
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

  document.querySelector<HTMLButtonElement>('#btn-lihat-semua')
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
        <div class="stat-label">Total Anggota</div>
      </div>
    `;

    // Render anggota terbaru (max 3)
    const anggotaPreview = document.querySelector<HTMLDivElement>('#anggota-preview')!;
    if (data.length === 0) {
      anggotaPreview.innerHTML = '<p class="empty">Belum ada anggota. Tambahkan anggota baru untuk memulai.</p>';
      return;
    }

    const recent = data.slice(0, 3);
    anggotaPreview.innerHTML = `
      <div style="display: grid; gap: 0.75rem;">
        ${recent.map((a) => `
          <div class="anggota-card">
            <div class="anggota-name">${esc(a.nama)}</div>
            <div class="anggota-info">
              <span>📍 ${esc(a.alamat) || '-'}</span>
              <span>📱 ${esc(a.no_telepon) || '-'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    const statsContainer = document.querySelector<HTMLDivElement>('#stats-container')!;
    statsContainer.innerHTML = `<p class="error">Gagal memuat data: ${(e as Error).message}</p>`;
  }
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

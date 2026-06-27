import { logout } from '../auth';
import { navigate } from '../router';
import { getAnggota, type Anggota } from '../api/anggota';
import { skeletonStats, skeletonRecent, getGreeting } from '../ui';

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

    <section class="hero-card">
      <h2>📌 Aksi Cepat</h2>
      <p>Tambah atau lihat data anggota PKK</p>
      <div class="quick-actions">
        <button id="btn-tambah-dashboard" class="btn-primary">➕ Tambah Anggota</button>
        <button id="btn-lihat-anggota" class="btn-secondary">📋 Lihat Daftar</button>
      </div>
    </section>

    <section class="stats-grid" id="stats-container">
      ${skeletonStats()}
    </section>

    <section class="card recent-section" id="recent-container">
      <div class="recent-header">
        <h2>🕐 Anggota Terbaru</h2>
        <button class="btn-link" id="btn-lihat-semua">Lihat Semua →</button>
      </div>
      <div id="recent-list">
        ${skeletonRecent()}
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

  document.querySelector<HTMLButtonElement>('#btn-lihat-semua')
    ?.addEventListener('click', () => navigate('/anggota'));

  loadDashboardData();
}

async function loadDashboardData(): Promise<void> {
  try {
    const data = await getAnggota();

    renderStats(data);
    renderRecentMembers(data);
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

    const recentContainer = document.querySelector<HTMLDivElement>('#recent-list')!;
    recentContainer.innerHTML = '';
  }
}

function renderStats(data: Anggota[]): void {
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

function renderRecentMembers(data: Anggota[]): void {
  const recentList = document.querySelector<HTMLDivElement>('#recent-list')!;

  if (data.length === 0) {
    recentList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">Belum Ada Anggota</div>
        <div class="empty-text">Mulai tambahkan anggota PKK pertama Anda.</div>
      </div>
    `;
    return;
  }

  // Show 3 most recent (already sorted by id DESC)
  const recent = data.slice(0, 3);

  recentList.innerHTML = `
    <div class="recent-list">
      ${recent.map(a => `
        <article class="recent-item" data-id="${a.id}">
          <div class="recent-avatar">${getInitials(a.nama)}</div>
          <div class="recent-info">
            <div class="recent-name">${esc(a.nama)}</div>
            <div class="recent-detail">${a.no_telepon ? '📱 ' + esc(a.no_telepon) : '📍 ' + esc(truncate(a.alamat || 'Belum ada alamat', 40))}</div>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  // Make recent items clickable
  recentList.querySelectorAll<HTMLDivElement>('.recent-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      if (id) navigate(`/anggota/edit?id=${id}`);
    });
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

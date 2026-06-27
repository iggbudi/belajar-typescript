import { getKegiatan, deleteKegiatan, type Kegiatan } from '../../api/kegiatan';
import { navigate } from '../../router';
import { logout } from '../../auth';
import { confirmDialog, showToast, skeletonCard } from '../../ui';

let kegiatanCache: Kegiatan[] = [];

export function kegiatanListPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">📋 Daftar Kegiatan</p>
          <h1>Kegiatan PKK</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">🚪 Keluar</button>
      </div>
    </header>

    <div class="toolbar">
      <button id="btn-tambah" class="btn-primary">➕ Tambah Kegiatan</button>
      <input id="search-kegiatan" class="search-input" type="search" placeholder="🔍 Cari kegiatan..." autocomplete="off" />
    </div>

    <div id="kegiatan-list">
      ${skeletonCard(2)}
    </div>
  `;
}

export async function mountKegiatanList(): Promise<void> {
  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });

  document.querySelector<HTMLButtonElement>('#btn-tambah')
    ?.addEventListener('click', () => navigate('/kegiatan/tambah'));

  const searchInput = document.querySelector<HTMLInputElement>('#search-kegiatan');
  searchInput?.addEventListener('input', () => renderKegiatanList(searchInput.value));

  const container = document.querySelector<HTMLDivElement>('#kegiatan-list')!;

  try {
    kegiatanCache = await getKegiatan();
    renderKegiatanList(searchInput?.value ?? '');
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Gagal Memuat Data</div>
        <div class="empty-text">Periksa koneksi internet lalu coba lagi.</div>
        <p class="error" style="margin:0;font-size:.82rem"><small>${(e as Error).message}</small></p>
      </div>
    `;
  }
}

function renderKegiatanList(keyword: string): void {
  const container = document.querySelector<HTMLDivElement>('#kegiatan-list');
  if (!container) return;

  const q = keyword.trim().toLowerCase();
  const data = q
    ? kegiatanCache.filter((k) => 
        k.judul.toLowerCase().includes(q) || 
        k.lokasi.toLowerCase().includes(q)
      )
    : kegiatanCache;

  if (kegiatanCache.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">Belum Ada Kegiatan</div>
        <div class="empty-text">Tekan tombol <strong>Tambah Kegiatan</strong> untuk mulai mencatat kegiatan PKK.</div>
      </div>
    `;
    return;
  }

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Tidak Ditemukan</div>
        <div class="empty-text">Kegiatan "<strong>${esc(keyword)}</strong>" tidak ada di daftar.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="anggota-list">
      ${data.map((k) => `
        <article class="anggota-card kegiatan-card">
          <div class="kegiatan-header">
            <div class="anggota-name">${esc(k.judul)}</div>
            <div class="kegiatan-badge">${formatDate(k.tanggal)}</div>
          </div>
          <div class="anggota-info">
            ${k.lokasi ? `<span>📍 ${esc(k.lokasi)}</span>` : ''}
            ${k.deskripsi ? `<span>📝 ${esc(shortText(k.deskripsi, 60))}</span>` : ''}
          </div>
          <div class="anggota-actions">
            <button class="btn-sm btn-absensi" data-id="${k.id}" data-title="${esc(k.judul)}">📋 Absensi</button>
            <button class="btn-sm btn-edit" data-id="${k.id}">✏️ Edit</button>
            <button class="btn-sm btn-hapus" data-id="${k.id}" data-name="${esc(k.judul)}">🗑️ Hapus</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  // Absensi button
  container.querySelectorAll<HTMLButtonElement>('.btn-absensi').forEach((btn) => {
    btn.addEventListener('click', () => navigate(`/kegiatan/absensi?id=${btn.dataset.id}`));
  });

  // Edit button
  container.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => navigate(`/kegiatan/edit?id=${btn.dataset.id}`));
  });

  // Delete button
  container.querySelectorAll<HTMLButtonElement>('.btn-hapus').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const name = btn.dataset.name ?? 'kegiatan ini';
      const ok = await confirmDialog({
        title: '🗑️ Hapus Kegiatan?',
        message: `Kegiatan "${name}" dan data absensinya akan dihapus permanen.`,
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal'
      });
      if (!ok) return;

      btn.disabled = true;
      btn.textContent = '⏳ Menghapus...';

      try {
        await deleteKegiatan(id);
        kegiatanCache = kegiatanCache.filter((k) => k.id !== id);
        renderKegiatanList(document.querySelector<HTMLInputElement>('#search-kegiatan')?.value ?? '');
        showToast('✓ Kegiatan berhasil dihapus.');
      } catch (err) {
        showToast('✗ Gagal hapus: ' + (err as Error).message, 'error');
        btn.disabled = false;
        btn.textContent = '🗑️ Hapus';
      }
    });
  });
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}

function shortText(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

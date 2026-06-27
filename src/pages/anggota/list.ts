import { getAnggota, deleteAnggota, type Anggota } from '../../api/anggota';
import { navigate } from '../../router';
import { logout } from '../../auth';
import { confirmDialog, showToast } from '../../ui';

let anggotaCache: Anggota[] = [];

export function anggotaListPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">Data Anggota</p>
          <h1>Anggota PKK</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">Keluar</button>
      </div>
    </header>

    <div class="toolbar">
      <button id="btn-tambah" class="btn-primary">+ Tambah Anggota</button>
      <input id="search-anggota" class="search-input" type="search" placeholder="Cari nama anggota..." autocomplete="off" />
    </div>

    <div id="anggota-list">
      <p class="loading">Memuat data anggota...</p>
    </div>
  `;
}

export async function mountAnggotaList(): Promise<void> {
  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });

  document.querySelector<HTMLButtonElement>('#btn-tambah')
    ?.addEventListener('click', () => navigate('/anggota/tambah'));

  const searchInput = document.querySelector<HTMLInputElement>('#search-anggota');
  searchInput?.addEventListener('input', () => renderAnggotaList(searchInput.value));

  const container = document.querySelector<HTMLDivElement>('#anggota-list')!;

  try {
    anggotaCache = await getAnggota();
    renderAnggotaList(searchInput?.value ?? '');
  } catch (e) {
    container.innerHTML = `<p class="error">Data anggota belum bisa dimuat. Periksa koneksi internet lalu coba lagi.<br><small>${(e as Error).message}</small></p>`;
  }
}

function renderAnggotaList(keyword: string): void {
  const container = document.querySelector<HTMLDivElement>('#anggota-list');
  if (!container) return;

  const q = keyword.trim().toLowerCase();
  const data = q
    ? anggotaCache.filter((a) => a.nama.toLowerCase().includes(q))
    : anggotaCache;

  if (anggotaCache.length === 0) {
    container.innerHTML = '<p class="empty">Belum ada anggota.<br>Tekan tombol <strong>Tambah Anggota</strong> untuk mulai.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p class="empty">Nama anggota tidak ditemukan.</p>';
    return;
  }

  container.innerHTML = `
    <div class="anggota-list">
      ${data.map((a) => `
        <article class="anggota-card">
          <div class="anggota-name">${esc(a.nama)}</div>
          <div class="anggota-info">
            ${a.alamat ? `<span>📍 ${esc(shortText(a.alamat, 72))}</span>` : ''}
            ${a.no_telepon ? `<span>☎️ ${esc(a.no_telepon)}</span>` : '<span>☎️ No. telepon belum diisi</span>'}
          </div>
          <div class="anggota-actions">
            <button class="btn-sm btn-edit" data-id="${a.id}">✏️ Edit</button>
            <button class="btn-sm btn-hapus" data-id="${a.id}" data-name="${esc(a.nama)}">🗑️ Hapus</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => navigate(`/anggota/edit?id=${btn.dataset.id}`));
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-hapus').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const name = btn.dataset.name ?? 'anggota ini';
      const ok = await confirmDialog({
        title: 'Hapus anggota?',
        message: `Data ${name} akan dihapus dari daftar anggota.`,
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal'
      });
      if (!ok) return;

      btn.disabled = true;
      btn.textContent = 'Menghapus...';

      try {
        await deleteAnggota(id);
        anggotaCache = anggotaCache.filter((a) => a.id !== id);
        renderAnggotaList(document.querySelector<HTMLInputElement>('#search-anggota')?.value ?? '');
        showToast('Data anggota berhasil dihapus.');
      } catch (err) {
        showToast(`Gagal hapus: ${(err as Error).message}`, 'error');
        btn.disabled = false;
        btn.textContent = '🗑️ Hapus';
      }
    });
  });
}

function shortText(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

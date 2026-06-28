import { getAnggota, deleteAnggota, type Anggota } from '../../api/anggota';
import { navigate } from '../../router';
import { confirmDialog, showToast, skeletonCard, initPullToRefresh, shortText, esc, invalidateBadgeCache, highlightMatch } from '../../ui';

let anggotaCache: Anggota[] = [];
let cleanupPull: (() => void) | null = null;

export function anggotaListPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">Data Anggota</p>
          <h1>Anggota PKK</h1>
        </div>
      </div>
    </header>

    <div class="toolbar">
      <div class="toolbar-row">
        <button id="btn-tambah" class="btn-primary">➕ Tambah</button>
        <button id="btn-export" class="btn-secondary btn-sm">📋 Export CSV</button>
      </div>
      <input id="search-anggota" class="search-input" type="search" placeholder="🔍 Cari nama anggota..." autocomplete="off" />
    </div>

    <div id="anggota-list">
      ${skeletonCard(3)}
    </div>
  `;
}

export async function mountAnggotaList(): Promise<void> {
  // Cleanup previous pull-to-refresh if any
  cleanupPull?.();

  document.querySelector<HTMLButtonElement>('#btn-export')
    ?.addEventListener('click', () => exportCSV());

  document.querySelector<HTMLButtonElement>('#btn-tambah')
    ?.addEventListener('click', () => navigate('/anggota/tambah'));

  const searchInput = document.querySelector<HTMLInputElement>('#search-anggota');
  searchInput?.addEventListener('input', () => renderAnggotaList(searchInput.value));

  const container = document.querySelector<HTMLDivElement>('#anggota-list')!;

  try {
    anggotaCache = await getAnggota();
    renderAnggotaList(searchInput?.value ?? '');

    // Initialize pull-to-refresh after data is loaded
    cleanupPull = initPullToRefresh({
      container,
      onRefresh: async () => {
        anggotaCache = await getAnggota();
        renderAnggotaList(searchInput?.value ?? '');
      }
    });
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

export function unmountAnggotaList(): void {
  cleanupPull?.();
  cleanupPull = null;
}

function renderAnggotaList(keyword: string): void {
  const container = document.querySelector<HTMLDivElement>('#anggota-list');
  if (!container) return;

  const q = keyword.trim().toLowerCase();
  const data = q
    ? anggotaCache.filter((a) => a.nama.toLowerCase().includes(q))
    : anggotaCache;

  if (anggotaCache.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-title">Belum Ada Anggota</div>
        <div class="empty-text">Tekan tombol <strong>Tambah Anggota</strong> untuk mulai mengelola data PKK.</div>
      </div>
    `;
    return;
  }

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Tidak Ditemukan</div>
        <div class="empty-text">Anggota dengan nama "<strong>${esc(keyword)}</strong>" tidak ada di daftar.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="anggota-list">
      ${data.map((a) => `
        <article class="anggota-card">
          <div class="anggota-name">${q ? highlightMatch(a.nama, keyword) : esc(a.nama)}</div>
          <div class="anggota-info">
            ${a.alamat ? `<span>📍 ${esc(shortText(a.alamat, 72))}</span>` : ''}
            ${a.no_telepon ? `<span>📱 ${esc(a.no_telepon)}</span>` : '<span>📵 No. telepon belum diisi</span>'}
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
    btn.addEventListener('click', () => navigate(`/anggota/edit/${btn.dataset.id}`));
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-hapus').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const name = btn.dataset.name ?? 'anggota ini';
      const ok = await confirmDialog({
        title: '🗑️ Hapus Anggota?',
        message: `Data "${name}" akan dihapus permanen dari daftar anggota.`,
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal'
      });
      if (!ok) return;

      btn.disabled = true;
      btn.textContent = '⏳ Menghapus...';

      try {
        await deleteAnggota(id);
        anggotaCache = anggotaCache.filter((a) => a.id !== id);
        invalidateBadgeCache();
        renderAnggotaList(document.querySelector<HTMLInputElement>('#search-anggota')?.value ?? '');
        showToast('✓ Data anggota berhasil dihapus.');
      } catch (err) {
        showToast('✗ Gagal hapus: ' + (err as Error).message, 'error');
        btn.disabled = false;
        btn.textContent = '🗑️ Hapus';
      }
    });
  });
}

function exportCSV(): void {
  if (anggotaCache.length === 0) {
    showToast('⚠️ Tidak ada data untuk di-export.', 'error');
    return;
  }
  const header = 'Nama,Alamat,No Telepon';
  const rows = anggotaCache.map(a =>
    `"${a.nama.replace(/"/g, '""')}","${a.alamat.replace(/"/g, '""')}","${a.no_telepon}"`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `anggota-pkk-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`✓ ${anggotaCache.length} data anggota berhasil di-export.`);
}



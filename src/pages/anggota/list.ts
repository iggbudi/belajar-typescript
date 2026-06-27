import { getAnggota, deleteAnggota } from '../../api/anggota';
import { navigate } from '../../router';

import { logout } from '../../auth';

export function anggotaListPage(): string {
  return `
    <header>
      <div class="header-row">
        <h1>Anggota PKK</h1>
        <button id="logout-btn" class="icon-btn" title="Logout">🚪</button>
      </div>
      <p>Daftar anggota PKK</p>
    </header>
    <div style="margin-bottom: 1rem;">
      <button id="btn-tambah" class="btn-primary">+ Tambah Anggota</button>
    </div>
    <div id="anggota-list">
      <p class="loading">Memuat data...</p>
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

  const container = document.querySelector<HTMLDivElement>('#anggota-list')!;

  try {
    const data = await getAnggota();
    if (data.length === 0) {
      container.innerHTML = '<p class="empty">Belum ada anggota. Klik "Tambah" untuk mulai.</p>';
      return;
    }
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Nama</th><th>Alamat</th><th>No. Telepon</th><th class="th-aksi">Aksi</th></tr>
          </thead>
          <tbody>
            ${data.map((a) => `
              <tr>
                <td>${esc(a.nama)}</td>
                <td>${esc(a.alamat)}</td>
                <td>${esc(a.no_telepon)}</td>
                <td class="td-aksi">
                  <button class="btn-sm btn-edit" data-id="${a.id}">Edit</button>
                  <button class="btn-sm btn-hapus" data-id="${a.id}">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach((btn) =>
      btn.addEventListener('click', () => navigate(`/anggota/edit?id=${btn.dataset.id}`))
    );

    container.querySelectorAll<HTMLButtonElement>('.btn-hapus').forEach((btn) =>
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus anggota ini?')) return;
        await deleteAnggota(Number(btn.dataset.id));
        mountAnggotaList();
      })
    );
  } catch (e) {
    container.innerHTML = `<p class="error">Gagal memuat data: ${(e as Error).message}</p>`;
  }
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

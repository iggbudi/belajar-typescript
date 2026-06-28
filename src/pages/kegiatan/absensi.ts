import { 
  getKegiatanById, 
  getAnggotaWithAbsensi, 
  setAbsensi,
  type Kegiatan,
  type AnggotaWithAbsensi 
} from '../../api/kegiatan';
import { navigate } from '../../router';
import { showToast, skeletonCard, formatDate, esc } from '../../ui';

let _kegiatanId: string | undefined;
let kegiatanData: Kegiatan | null = null;
let anggotaData: AnggotaWithAbsensi[] = [];

export function absensiPage(id?: string): string {
  _kegiatanId = id;
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">📋 Absensi Kegiatan</p>
          <h1 id="kegiatan-title">Memuat...</h1>
        </div>
      </div>
    </header>

    <div class="card" id="kegiatan-info">
      <p class="loading">Memuat informasi kegiatan...</p>
    </div>

    <div class="card absensi-summary" id="absensi-summary" style="display:none">
      <div class="stats-row">
        <div class="stat-card-secondary">
          <div class="stat-icon">✅</div>
          <div class="stat-number" id="count-hadir">0</div>
          <div class="stat-label">Hadir</div>
        </div>
        <div class="stat-card-secondary">
          <div class="stat-icon">❌</div>
          <div class="stat-number" id="count-tidak-hadir">0</div>
          <div class="stat-label">Tidak Hadir</div>
        </div>
        <div class="stat-card-secondary">
          <div class="stat-icon">🙋</div>
          <div class="stat-number" id="count-izin">0</div>
          <div class="stat-label">Izin</div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button id="btn-back" class="btn-secondary">← Kembali</button>
      <button id="btn-save-absensi" class="btn-primary">💾 Simpan Absensi</button>
    </div>

    <div id="anggota-absensi-list">
      ${skeletonCard(3)}
    </div>
  `;
}

export async function mountAbsensiPage(): Promise<void> {
  const kegiatanId = _kegiatanId ? Number(_kegiatanId) : null;

  if (!kegiatanId) {
    navigate('/kegiatan');
    return;
  }

  document.querySelector<HTMLButtonElement>('#btn-back')
    ?.addEventListener('click', () => navigate('/kegiatan'));

  document.querySelector<HTMLButtonElement>('#btn-save-absensi')
    ?.addEventListener('click', () => saveAbsensi(kegiatanId));

  await loadData(kegiatanId);
}

async function loadData(kegiatanId: number): Promise<void> {
  try {
    kegiatanData = await getKegiatanById(kegiatanId);
    if (!kegiatanData) {
      showToast('✗ Kegiatan tidak ditemukan.', 'error');
      navigate('/kegiatan');
      return;
    }

    const titleEl = document.querySelector<HTMLHeadingElement>('#kegiatan-title');
    if (titleEl) titleEl.textContent = kegiatanData.judul;

    const infoEl = document.querySelector<HTMLDivElement>('#kegiatan-info');
    if (infoEl) {
      infoEl.innerHTML = `
        <h2 style="margin-bottom:0.5rem">📌 ${esc(kegiatanData.judul)}</h2>
        <div class="anggota-info">
          <span>📅 ${formatDate(kegiatanData.tanggal, 'long')}</span>
          ${kegiatanData.lokasi ? `<span>📍 ${esc(kegiatanData.lokasi)}</span>` : ''}
          ${kegiatanData.deskripsi ? `<span>📝 ${esc(kegiatanData.deskripsi)}</span>` : ''}
        </div>
      `;
    }

    anggotaData = await getAnggotaWithAbsensi(kegiatanId);
    renderAnggotaList();
    updateSummary();
  } catch (e) {
    const container = document.querySelector<HTMLDivElement>('#anggota-absensi-list');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Gagal Memuat Data</div>
          <div class="empty-text">${(e as Error).message}</div>
        </div>
      `;
    }
  }
}

function renderAnggotaList(): void {
  const container = document.querySelector<HTMLDivElement>('#anggota-absensi-list');
  if (!container) return;

  if (anggotaData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-title">Belum Ada Anggota</div>
        <div class="empty-text">Tambahkan anggota PKK terlebih dahulu sebelum mengisi absensi.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="absensi-list">
      ${anggotaData.map((a, index) => `
        <article class="anggota-card absensi-card" data-id="${a.id}" data-index="${index}">
          <div class="absensi-info">
            <div class="anggota-name">${esc(a.nama)}</div>
            <div class="anggota-info">
              ${a.no_telepon ? `<span>📱 ${esc(a.no_telepon)}</span>` : ''}
            </div>
          </div>
          <div class="absensi-buttons" data-index="${index}">
            <button class="btn-absensi-status ${a.status === 'hadir' ? 'active-hadir' : ''}" data-status="hadir">✅ Hadir</button>
            <button class="btn-absensi-status ${a.status === 'tidak_hadir' ? 'active-tidak' : ''}" data-status="tidak_hadir">❌ Tidak</button>
            <button class="btn-absensi-status ${a.status === 'izin' ? 'active-izin' : ''}" data-status="izin">🙋 Izin</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  // Event listeners for status buttons
  container.querySelectorAll<HTMLDivElement>('.absensi-buttons').forEach(group => {
    const index = Number(group.dataset.index);
    group.querySelectorAll<HTMLButtonElement>('.btn-absensi-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.dataset.status as 'hadir' | 'tidak_hadir' | 'izin';
        anggotaData[index].status = status;

        // Update active states within this group
        group.querySelectorAll('.btn-absensi-status').forEach(b => {
          b.classList.remove('active-hadir', 'active-tidak', 'active-izin');
        });
        btn.classList.add(`active-${status === 'tidak_hadir' ? 'tidak' : status}`);

        updateSummary();
      });
    });
  });
}

function updateSummary(): void {
  const summaryEl = document.querySelector<HTMLDivElement>('#absensi-summary');
  if (!summaryEl) return;

  const hadir = anggotaData.filter(a => a.status === 'hadir').length;
  const tidakHadir = anggotaData.filter(a => a.status === 'tidak_hadir').length;
  const izin = anggotaData.filter(a => a.status === 'izin').length;

  document.querySelector<HTMLDivElement>('#count-hadir')!.textContent = String(hadir);
  document.querySelector<HTMLDivElement>('#count-tidak-hadir')!.textContent = String(tidakHadir);
  document.querySelector<HTMLDivElement>('#count-izin')!.textContent = String(izin);

  summaryEl.style.display = 'block';
}

async function saveAbsensi(kegiatanId: number): Promise<void> {
  const submitBtn = document.querySelector<HTMLButtonElement>('#btn-save-absensi');
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Menyimpan...';

  try {
    const promises = anggotaData.map(a =>
      setAbsensi({
        kegiatan_id: kegiatanId,
        anggota_id: a.id,
        status: a.status || 'tidak_hadir',
      })
    );

    await Promise.all(promises);
    showToast('✓ Absensi berhasil disimpan.');
    await loadData(kegiatanId);
  } catch (err) {
    showToast('✗ Gagal menyimpan absensi: ' + (err as Error).message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Simpan Absensi';
  }
}

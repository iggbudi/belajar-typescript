import { 
  getKegiatanById, 
  getAnggotaWithAbsensi, 
  setAbsensi,
  type Kegiatan,
  type AnggotaWithAbsensi 
} from '../../api/kegiatan';
import { logout } from '../../auth';
import { navigate } from '../../router';
import { showToast, skeletonCard } from '../../ui';

let kegiatanData: Kegiatan | null = null;
let anggotaData: AnggotaWithAbsensi[] = [];

export function absensiPage(): string {
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">📋 Absensi Kegiatan</p>
          <h1 id="kegiatan-title">Memuat...</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">🚪 Keluar</button>
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
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const kegiatanId = params.get('id') ? Number(params.get('id')) : null;

  if (!kegiatanId) {
    navigate('/kegiatan');
    return;
  }

  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });

  document.querySelector<HTMLButtonElement>('#btn-back')
    ?.addEventListener('click', () => navigate('/kegiatan'));

  document.querySelector<HTMLButtonElement>('#btn-save-absensi')
    ?.addEventListener('click', () => saveAbsensi(kegiatanId));

  await loadData(kegiatanId);
}

async function loadData(kegiatanId: number): Promise<void> {
  try {
    // Load kegiatan
    kegiatanData = await getKegiatanById(kegiatanId);
    if (!kegiatanData) {
      showToast('✗ Kegiatan tidak ditemukan.', 'error');
      navigate('/kegiatan');
      return;
    }

    // Update title
    const titleEl = document.querySelector<HTMLHeadingElement>('#kegiatan-title');
    if (titleEl) titleEl.textContent = kegiatanData.judul;

    // Update info
    const infoEl = document.querySelector<HTMLDivElement>('#kegiatan-info');
    if (infoEl) {
      infoEl.innerHTML = `
        <h2 style="margin-bottom:0.5rem">📌 ${esc(kegiatanData.judul)}</h2>
        <div class="anggota-info">
          <span>📅 ${formatDate(kegiatanData.tanggal)}</span>
          ${kegiatanData.lokasi ? `<span>📍 ${esc(kegiatanData.lokasi)}</span>` : ''}
          ${kegiatanData.deskripsi ? `<span>📝 ${esc(kegiatanData.deskripsi)}</span>` : ''}
        </div>
      `;
    }

    // Load anggota with absensi
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
          <div class="absensi-buttons">
            <button class="btn-hadir ${a.status === 'hadir' ? 'active' : ''}" data-status="hadir" data-index="${index}">
              ${a.status === 'hadir' ? '✅ Hadir' : '☐ Tandai Hadir'}
            </button>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  // Add event listeners to absensi buttons
  container.querySelectorAll<HTMLButtonElement>('.btn-hadir').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      const currentStatus = anggotaData[index].status;
      
      // Toggle: if already hadir, set to tidak_hadir; otherwise set to hadir
      const newStatus = currentStatus === 'hadir' ? 'tidak_hadir' : 'hadir';
      anggotaData[index].status = newStatus;
      
      // Update UI
      btn.classList.toggle('active', newStatus === 'hadir');
      btn.textContent = newStatus === 'hadir' ? '✅ Hadir' : '☐ Tandai Hadir';
      
      updateSummary();
    });
  });
}

function updateSummary(): void {
  const summaryEl = document.querySelector<HTMLDivElement>('#absensi-summary');
  if (!summaryEl) return;

  const hadir = anggotaData.filter(a => a.status === 'hadir').length;
  const tidakHadir = anggotaData.filter(a => a.status !== 'hadir').length;

  document.querySelector<HTMLDivElement>('#count-hadir')!.textContent = String(hadir);
  document.querySelector<HTMLDivElement>('#count-tidak-hadir')!.textContent = String(tidakHadir);
  
  summaryEl.style.display = 'block';
}

async function saveAbsensi(kegiatanId: number): Promise<void> {
  const submitBtn = document.querySelector<HTMLButtonElement>('#btn-save-absensi');
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Menyimpan...';

  try {
    // Save each anggota's absensi
    const promises = anggotaData.map(a => 
      setAbsensi({
        kegiatan_id: kegiatanId,
        anggota_id: a.id,
        status: a.status || 'tidak_hadir',
      })
    );

    await Promise.all(promises);
    
    showToast('✓ Absensi berhasil disimpan.');
    
    // Reload data to refresh
    await loadData(kegiatanId);
  } catch (err) {
    showToast('✗ Gagal menyimpan absensi: ' + (err as Error).message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Simpan Absensi';
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

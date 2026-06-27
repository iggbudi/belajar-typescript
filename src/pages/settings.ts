import { logout } from '../auth';
import { navigate } from '../router';
import { showToast, confirmDialog } from '../ui';

const IURAN_KEY = 'pkk_iuran_amount';
const IURAN_UPDATED_KEY = 'pkk_iuran_updated';

export function settingsPage(): string {
  const iuran = getIuran();
  const lastUpdated = localStorage.getItem(IURAN_UPDATED_KEY) || '-';

  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">⚙️ Pengaturan</p>
          <h1>Menu Setting</h1>
        </div>
        <button id="logout-btn" class="logout-btn" title="Keluar">🚪 Keluar</button>
      </div>
    </header>

    <!-- Iuran Card -->
    <section class="settings-card">
      <div class="settings-card-header">
        <span class="settings-icon">💰</span>
        <div>
          <h2>Uang Iuran</h2>
          <p class="settings-subtitle">Atur nominal iuran per anggota</p>
        </div>
      </div>

      <div class="iuran-display">
        <div class="iuran-amount">${formatRupiah(iuran)}</div>
        <div class="iuran-label">per anggota / bulan</div>
        <div class="iuran-updated">Terakhir diubah: ${lastUpdated}</div>
      </div>

      <div class="iuran-form-group" id="iuran-form" style="display:none">
        <label for="input-iuran" class="form-label">Nominal Baru (Rp)</label>
        <input 
          type="text" 
          id="input-iuran" 
          class="form-input iuran-input"
          placeholder="Contoh: 25000"
          inputmode="numeric"
          autocomplete="off"
        />
        <div class="iuran-quick-actions">
          <button class="btn-quick-amount" data-amount="10000">Rp 10.000</button>
          <button class="btn-quick-amount" data-amount="15000">Rp 15.000</button>
          <button class="btn-quick-amount" data-amount="20000">Rp 20.000</button>
          <button class="btn-quick-amount" data-amount="25000">Rp 25.000</button>
          <button class="btn-quick-amount" data-amount="50000">Rp 50.000</button>
        </div>
        <div class="form-actions-stack">
          <button id="btn-simpan-iuran" class="btn-primary btn-large">💾 Simpan</button>
          <button id="btn-batal-iuran" class="btn-secondary btn-large">Batal</button>
        </div>
      </div>

      <div id="iuran-actions">
        <button id="btn-edit-iuran" class="btn-primary btn-large">✏️ Ubah Nominal Iuran</button>
      </div>
    </section>

    <!-- Info Card -->
    <section class="settings-card settings-card-info">
      <div class="settings-card-header">
        <span class="settings-icon">ℹ️</span>
        <div>
          <h2>Tentang Aplikasi</h2>
          <p class="settings-subtitle">Informasi aplikasi PKK</p>
        </div>
      </div>
      <div class="settings-info-list">
        <div class="settings-info-item">
          <span class="settings-info-label">Nama Aplikasi</span>
          <span class="settings-info-value">Aplikasi Kegiatan PKK</span>
        </div>
        <div class="settings-info-item">
          <span class="settings-info-label">Versi</span>
          <span class="settings-info-value">1.0.0</span>
        </div>
        <div class="settings-info-item">
          <span class="settings-info-label">Wilayah</span>
          <span class="settings-info-value">Sembungharjo RT 03/RW 02</span>
        </div>
      </div>
    </section>
  `;
}

export function mountSettings(): void {
  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '🚪 Keluar?',
        message: 'Anda akan keluar dari aplikasi.',
        confirmText: 'Ya, Keluar',
        cancelText: 'Batal'
      });
      if (!ok) return;
      logout();
      navigate('/login');
    });

  const btnEdit = document.querySelector<HTMLButtonElement>('#btn-edit-iuran');
  const btnSimpan = document.querySelector<HTMLButtonElement>('#btn-simpan-iuran');
  const btnBatal = document.querySelector<HTMLButtonElement>('#btn-batal-iuran');
  const formGroup = document.querySelector<HTMLDivElement>('#iuran-form-group') || 
                     document.querySelector<HTMLDivElement>('#iuran-form');
  const actionsDiv = document.querySelector<HTMLDivElement>('#iuran-actions');
  const input = document.querySelector<HTMLInputElement>('#input-iuran');

  // Format input on typing
  input?.addEventListener('input', () => {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
      // Don't format while typing, just keep raw number
      input.value = value;
    }
  });

  // Quick amount buttons
  document.querySelectorAll<HTMLButtonElement>('.btn-quick-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      if (input && amount) {
        input.value = amount;
      }
    });
  });

  // Edit button
  btnEdit?.addEventListener('click', () => {
    const currentIuran = getIuran();
    if (input) input.value = currentIuran > 0 ? String(currentIuran) : '';
    formGroup!.style.display = 'block';
    actionsDiv!.style.display = 'none';
    input?.focus();
  });

  // Cancel button
  btnBatal?.addEventListener('click', () => {
    formGroup!.style.display = 'none';
    actionsDiv!.style.display = 'block';
  });

  // Save button
  btnSimpan?.addEventListener('click', () => {
    const value = input?.value?.trim();
    if (!value) {
      showToast('⚠️ Masukkan nominal iuran.', 'error');
      return;
    }

    const amount = parseInt(value, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('⚠️ Nominal tidak valid.', 'error');
      return;
    }

    if (amount > 10000000) {
      showToast('⚠️ Nominal terlalu besar (maksimal 10 juta).', 'error');
      return;
    }

    saveIuran(amount);
    showToast('✓ Nominal iuran berhasil disimpan.');

    // Refresh page
    setTimeout(() => navigate('/settings'), 300);
  });
}

export function getIuran(): number {
  const saved = localStorage.getItem(IURAN_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

function saveIuran(amount: number): void {
  localStorage.setItem(IURAN_KEY, String(amount));
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  localStorage.setItem(IURAN_UPDATED_KEY, dateStr);
}

function formatRupiah(amount: number): string {
  if (amount === 0) return 'Belum diatur';
  return 'Rp ' + amount.toLocaleString('id-ID');
}

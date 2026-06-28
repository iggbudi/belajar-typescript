import { getKegiatanById, createKegiatan, updateKegiatan } from '../../api/kegiatan';
import { navigate } from '../../router';
import { setFlashToast, invalidateBadgeCache, markDirty, clearDirty, confirmIfDirty } from '../../ui';

let _formId: string | undefined;
let _formIsEdit: boolean;

export function kegiatanFormPage(isEdit: boolean, id?: string): string {
  _formIsEdit = isEdit;
  _formId = id;
  const today = new Date().toISOString().split('T')[0];
  const label = isEdit;
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">${label ? '✏️ Perbarui Kegiatan' : '➕ Kegiatan Baru'}</p>
          <h1>${label ? 'Edit' : 'Tambah'} Kegiatan</h1>
        </div>
      </div>
    </header>

    <div class="form-card">
      <form id="kegiatan-form">
        <!-- Judul -->
        <div class="form-group">
          <label for="field-judul" class="form-label">
            📌 Judul Kegiatan <span class="req">*</span>
          </label>
          <input 
            type="text" 
            id="field-judul" 
            class="form-input"
            placeholder="Contoh: Rapat PKK Bulanan"
            required 
            autocomplete="off"
          />
          <small class="form-hint">Wajib diisi. Judul kegiatan yang akan dilaksanakan.</small>
        </div>

        <!-- Tanggal -->
        <div class="form-group">
          <label for="field-tanggal" class="form-label">
            📅 Tanggal <span class="req">*</span>
          </label>
          <input 
            type="date" 
            id="field-tanggal" 
            class="form-input"
            value="${today}"
            required
          />
          <small class="form-hint">Tanggal pelaksanaan kegiatan.</small>
        </div>

        <!-- Lokasi -->
        <div class="form-group">
          <label for="field-lokasi" class="form-label">
            📍 Lokasi
          </label>
          <input 
            type="text" 
            id="field-lokasi" 
            class="form-input"
            placeholder="Contoh: Balai Warga RT 03"
            autocomplete="off"
          />
          <small class="form-hint">Opsional. Tempat kegiatan dilaksanakan.</small>
        </div>

        <!-- Deskripsi -->
        <div class="form-group">
          <label for="field-deskripsi" class="form-label">
            📝 Deskripsi
          </label>
          <textarea 
            id="field-deskripsi" 
            class="form-textarea"
            rows="3"
            placeholder="Jelaskan detail kegiatan..."
          ></textarea>
          <small class="form-hint">Opsional. Detail atau catatan tentang kegiatan.</small>
        </div>

        <!-- Error Message -->
        <p id="form-error" class="form-error hidden"></p>

        <!-- Action Buttons -->
        <div class="form-actions-stack">
          <button type="submit" id="btn-simpan" class="btn-primary btn-large">
            💾 Simpan Kegiatan
          </button>
          <button type="button" id="btn-batal" class="btn-secondary btn-large">
            ← Batal
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function mountKegiatanForm(): Promise<void> {
  const isEdit = _formIsEdit;
  const numId = isEdit ? Number(_formId) : null;

  // Load data if edit
  if (isEdit && numId) {
    try {
      const k = await getKegiatanById(numId);
      if (k) {
        (document.querySelector<HTMLInputElement>('#field-judul')!).value = k.judul;
        (document.querySelector<HTMLInputElement>('#field-tanggal')!).value = k.tanggal;
        (document.querySelector<HTMLInputElement>('#field-lokasi')!).value = k.lokasi;
        (document.querySelector<HTMLTextAreaElement>('#field-deskripsi')!).value = k.deskripsi;
      }
    } catch (err) {
      console.error('Failed to load kegiatan:', err);
    }
  }

  // Track dirty state
  const formEl = document.querySelector<HTMLFormElement>('#kegiatan-form');
  formEl?.addEventListener('input', () => markDirty());

  // Cancel button
  document.querySelector<HTMLButtonElement>('#btn-batal')
    ?.addEventListener('click', async () => {
      if (await confirmIfDirty()) navigate('/kegiatan');
    });

  // Form submit
  document.querySelector<HTMLFormElement>('#kegiatan-form')
    ?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const judul = (document.querySelector<HTMLInputElement>('#field-judul')!).value.trim();
      const tanggal = (document.querySelector<HTMLInputElement>('#field-tanggal')!).value;
      const lokasi = (document.querySelector<HTMLInputElement>('#field-lokasi')!).value.trim();
      const deskripsi = (document.querySelector<HTMLTextAreaElement>('#field-deskripsi')!).value.trim();
      const errorEl = document.querySelector<HTMLParagraphElement>('#form-error')!;
      const submitBtn = document.querySelector<HTMLButtonElement>('#btn-simpan')!;

      // Clear error
      errorEl.classList.add('hidden');

      // Validation
      if (!judul) {
        errorEl.textContent = '⚠️ Judul kegiatan wajib diisi.';
        errorEl.classList.remove('hidden');
        (document.querySelector<HTMLInputElement>('#field-judul'))?.focus();
        return;
      }

      if (judul.length < 3) {
        errorEl.textContent = '⚠️ Judul minimal 3 huruf.';
        errorEl.classList.remove('hidden');
        (document.querySelector<HTMLInputElement>('#field-judul'))?.focus();
        return;
      }

      if (!tanggal) {
        errorEl.textContent = '⚠️ Tanggal kegiatan wajib diisi.';
        errorEl.classList.remove('hidden');
        (document.querySelector<HTMLInputElement>('#field-tanggal'))?.focus();
        return;
      }

      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Menyimpan...';

      try {
        if (isEdit && numId) {
          await updateKegiatan(numId, { judul, tanggal, lokasi, deskripsi });
        } else {
          await createKegiatan({ judul, tanggal, lokasi, deskripsi });
        }
        setFlashToast(isEdit ? '✓ Kegiatan berhasil diperbarui.' : '✓ Kegiatan baru berhasil disimpan.');
        invalidateBadgeCache();
        clearDirty();
        navigate('/kegiatan');
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Simpan Kegiatan';
        const error = err as Error;
        console.error('Form submit error:', {
          message: error.message,
          stack: error.stack,
          judul,
          tanggal,
          lokasi,
          deskripsi,
          isEdit,
          formId: _formId
        });
        errorEl.textContent = `❌ Gagal menyimpan data. ${error.message}`;
        errorEl.classList.remove('hidden');
      }
    });

  // Auto focus on first field
  setTimeout(() => (document.querySelector<HTMLInputElement>('#field-judul'))?.focus(), 100);
}

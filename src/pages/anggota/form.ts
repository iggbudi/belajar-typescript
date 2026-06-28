import { getAnggotaById, createAnggota, updateAnggota } from '../../api/anggota';
import { navigate } from '../../router';
import { setFlashToast, invalidateBadgeCache, markDirty, clearDirty, confirmIfDirty } from '../../ui';

// Store params from route (passed via guard)
let _formId: string | undefined;
let _formIsEdit: boolean;

export function anggotaFormPage(isEdit: boolean, id?: string): string {
  _formIsEdit = isEdit;
  _formId = id;
  const isEditLabel = isEdit;
  return `
    <header>
      <div class="header-row">
        <div>
          <p class="header-kicker">${isEditLabel ? '✏️ Perbarui Data' : '➕ Data Baru'}</p>
          <h1>${isEditLabel ? 'Edit' : 'Tambah'} Anggota</h1>
        </div>
      </div>
    </header>

    <div class="form-card">
      <form id="anggota-form">
        <!-- Nama -->
        <div class="form-group">
          <label for="field-nama" class="form-label">
            👤 Nama Lengkap <span class="req">*</span>
          </label>
          <input 
            type="text" 
            id="field-nama" 
            class="form-input"
            placeholder="Contoh: Ibu Siti Aminah"
            required 
            autocomplete="off"
          />
          <small class="form-hint">Wajib diisi agar mudah dicari di daftar anggota.</small>
        </div>

        <!-- Alamat -->
        <div class="form-group">
          <label for="field-alamat" class="form-label">
            📍 Alamat
          </label>
          <textarea 
            id="field-alamat" 
            class="form-textarea"
            rows="3"
            placeholder="Jalan Widoro 4, Sembungharjo RT 03/RW 02"
          >Jalan Widoro 4, Sembungharjo RT 03/RW 02</textarea>
          <small class="form-hint">Sudah terisi alamat umum, silakan ubah atau lengkapi nomor rumah.</small>
        </div>

        <!-- No. Telepon -->
        <div class="form-group">
          <label for="field-telepon" class="form-label">
            📱 No. Telepon
          </label>
          <input 
            type="tel" 
            id="field-telepon" 
            class="form-input"
            placeholder="08xxxxxxxxx"
            autocomplete="off"
            pattern="[0-9+]*"
          />
          <small class="form-hint">Opsional. Isi bila anggota memiliki nomor yang bisa dihubungi.</small>
        </div>

        <!-- Error Message -->
        <p id="form-error" class="form-error hidden"></p>

        <!-- Action Buttons -->
        <div class="form-actions-stack">
          <button type="submit" id="btn-simpan" class="btn-primary btn-large">
            💾 Simpan Data
          </button>
          <button type="button" id="btn-batal" class="btn-secondary btn-large">
            ← Batal
          </button>
        </div>
      </form>
    </div>
  `;
}

export async function mountAnggotaForm(): Promise<void> {
  const isEdit = _formIsEdit;
  const numId = isEdit ? Number(_formId) : null;

  // Load data if edit
  if (isEdit && numId) {
    try {
      const a = await getAnggotaById(numId);
      if (a) {
        (document.querySelector<HTMLInputElement>('#field-nama')!).value = a.nama;
        (document.querySelector<HTMLTextAreaElement>('#field-alamat')!).value = a.alamat;
        (document.querySelector<HTMLInputElement>('#field-telepon')!).value = a.no_telepon;
      }
    } catch (err) {
      console.error('Failed to load anggota:', err);
    }
  }

  // Track dirty state
  const formEl = document.querySelector<HTMLFormElement>('#anggota-form');
  formEl?.addEventListener('input', () => markDirty());

  // Cancel button
  document.querySelector<HTMLButtonElement>('#btn-batal')
    ?.addEventListener('click', async () => {
      if (await confirmIfDirty()) navigate('/anggota');
    });

  // Form submit
  document.querySelector<HTMLFormElement>('#anggota-form')
    ?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = (document.querySelector<HTMLInputElement>('#field-nama')!).value.trim();
      const alamat = (document.querySelector<HTMLTextAreaElement>('#field-alamat')!).value.trim();
      const no_telepon = (document.querySelector<HTMLInputElement>('#field-telepon')!).value.trim();
      const errorEl = document.querySelector<HTMLParagraphElement>('#form-error')!;
      const submitBtn = document.querySelector<HTMLButtonElement>('#btn-simpan')!;

      // Clear error
      errorEl.classList.add('hidden');

      // Validation
      if (!nama) {
        errorEl.textContent = '⚠️ Nama anggota wajib diisi.';
        errorEl.classList.remove('hidden');
        (document.querySelector<HTMLInputElement>('#field-nama'))?.focus();
        return;
      }

      if (nama.length < 3) {
        errorEl.textContent = '⚠️ Nama minimal 3 huruf.';
        errorEl.classList.remove('hidden');
        (document.querySelector<HTMLInputElement>('#field-nama'))?.focus();
        return;
      }

      // Disable submit button to prevent double click
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Menyimpan...';

      try {
        if (isEdit && numId) {
          await updateAnggota(numId, { nama, alamat, no_telepon });
        } else {
          await createAnggota({ nama, alamat, no_telepon });
        }
        setFlashToast(isEdit ? '✓ Data anggota berhasil diperbarui.' : '✓ Anggota baru berhasil disimpan.');
        invalidateBadgeCache();
        clearDirty();
        navigate('/anggota');
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Simpan Data';
        const error = err as Error;
        console.error('Form submit error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          nama,
          alamat,
          no_telepon,
          isEdit,
          formId: _formId
        });
        errorEl.textContent = `❌ Gagal menyimpan data. ${error.message}`;
        errorEl.classList.remove('hidden');
      }
    });

  // Auto focus on first field
  setTimeout(() => (document.querySelector<HTMLInputElement>('#field-nama'))?.focus(), 100);
}

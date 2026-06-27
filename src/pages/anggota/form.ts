import { getAnggotaById, createAnggota, updateAnggota } from '../../api/anggota';
import { navigate } from '../../router';

export function anggotaFormPage(isEdit: boolean): string {
  return `
    <header>
      <h1>${isEdit ? 'Edit' : 'Tambah'} Anggota</h1>
    </header>
    <div class="card">
      <form id="anggota-form">
        <label>
          Nama <span class="req">*</span>
          <input type="text" id="field-nama" required autocomplete="off" />
        </label>
        <label>
          Alamat
          <textarea id="field-alamat" rows="2"></textarea>
        </label>
        <label>
          No. Telepon
          <input type="tel" id="field-telepon" autocomplete="off" />
        </label>
        <p id="form-error" class="error hidden"></p>
        <div class="form-actions">
          <button type="button" id="btn-batal" class="btn-outline">Batal</button>
          <button type="submit" id="btn-simpan" class="btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  `;
}

export async function mountAnggotaForm(): Promise<void> {
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const id = params.get('id') ? Number(params.get('id')) : null;
  const isEdit = id !== null;

  if (isEdit && id) {
    const a = await getAnggotaById(id);
    if (a) {
      (document.querySelector<HTMLInputElement>('#field-nama')!).value = a.nama;
      (document.querySelector<HTMLTextAreaElement>('#field-alamat')!).value = a.alamat;
      (document.querySelector<HTMLInputElement>('#field-telepon')!).value = a.no_telepon;
    }
  }

  document.querySelector<HTMLButtonElement>('#btn-batal')
    ?.addEventListener('click', () => navigate('/anggota'));

  document.querySelector<HTMLFormElement>('#anggota-form')
    ?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = (document.querySelector<HTMLInputElement>('#field-nama')!).value.trim();
      const alamat = (document.querySelector<HTMLTextAreaElement>('#field-alamat')!).value.trim();
      const no_telepon = (document.querySelector<HTMLInputElement>('#field-telepon')!).value.trim();
      const errorEl = document.querySelector<HTMLParagraphElement>('#form-error')!;

      if (!nama) {
        errorEl.textContent = 'Nama wajib diisi';
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        if (isEdit && id) {
          await updateAnggota(id, { nama, alamat, no_telepon });
        } else {
          await createAnggota({ nama, alamat, no_telepon });
        }
        navigate('/anggota');
      } catch (err) {
        errorEl.textContent = (err as Error).message;
        errorEl.classList.remove('hidden');
      }
    });

  setTimeout(() => (document.querySelector<HTMLInputElement>('#field-nama'))?.focus(), 100);
}

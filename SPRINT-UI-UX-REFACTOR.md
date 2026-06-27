# Sprint Refactor Total UI/UX PWA PKK

Tanggal mulai: 2026-06-27  
Target pengguna: kader/ibu PKK pengguna HP Android, termasuk perangkat low-end.  
Arah desain: hangat, sederhana, mobile-first, mudah disentuh, minim istilah teknis.

## Sprint Goal

Mengubah PWA dari tampilan demo sederhana menjadi aplikasi harian PKK yang lebih nyaman dipakai di HP: navigasi jelas, tombol besar, daftar anggota mudah dibaca, form mudah diisi, dan state loading/error/empty lebih ramah.

## Prinsip Desain

1. **Mobile-first**: nyaman di layar kecil 360px.
2. **Touch-friendly**: tombol minimal 44px, jarak antar aksi aman.
3. **Bahasa sederhana**: teks jelas untuk pengguna non-teknis.
4. **Ringan**: tanpa library UI tambahan, animasi halus dan ringan.
5. **PKK-friendly visual**: warna hijau/sage, krem hangat, aksen rose/coral.
6. **Tidak pakai tabel untuk mobile**: daftar anggota menjadi card list.
7. **Selalu ada feedback**: loading, empty, error, success.

## Scope Sprint

### In Scope

- Refactor design system global di `src/style.css`.
- Refactor layout shell dan bottom navigation.
- Refactor halaman login.
- Refactor dashboard/beranda.
- Refactor daftar anggota dari tabel menjadi card list.
- Tambah pencarian anggota lokal.
- Refactor form tambah/edit anggota.
- Tambah state loading, empty, error yang konsisten.
- Tambah toast sederhana untuk feedback sukses/gagal bila memungkinkan.
- Build test setelah perubahan besar.

### Out of Scope untuk Sprint Ini

- Migrasi framework ke React/Vue/Svelte.
- Perubahan skema database.
- Fitur kegiatan PKK penuh.
- Multi-user/auth kompleks.
- Upload foto anggota.

## Backlog Sprint

### 1. Design System Global

**File utama:** `src/style.css`

Tasks:

- Ganti token warna dari TypeScript blue menjadi palet PKK.
- Buat CSS variables untuk warna, spacing, radius, shadow, typography.
- Rapikan style button, card, form, header, nav.
- Tambah utility class untuk hidden, loading, empty, error.
- Pastikan `body` dan `#app` tetap mobile-first.

Acceptance Criteria:

- Tampilan tidak lagi memakai identitas biru TypeScript.
- Button, card, input punya ukuran dan spacing konsisten.
- Build berhasil.

---

### 2. App Shell & Navigation

**File utama:** `src/main.ts`, `src/style.css`

Tasks:

- Rapikan render bottom nav.
- Gunakan label jelas: `Beranda`, `Anggota`.
- Active state lebih terlihat.
- Area sentuh nav minimal 44px.
- Pastikan nav tidak muncul di login.
- Tambah safe area untuk perangkat mobile.

Acceptance Criteria:

- Bottom nav stabil di semua halaman authenticated.
- Tidak double render saat hash berubah.
- Login tetap tanpa bottom nav.

---

### 3. Login Page Baru

**File utama:** `src/pages/login.ts`

Tasks:

- Refactor copywriting login agar lebih ramah.
- Tambah visual card yang hangat.
- Input dan button full width.
- Error tampil jelas.
- Fokus password tetap dipertahankan.

Acceptance Criteria:

- Login nyaman dipakai satu tangan.
- Error login mudah terlihat.
- Tidak ada perubahan logic auth.

---

### 4. Dashboard / Beranda Baru

**File utama:** `src/pages/dashboard.ts`

Tasks:

- Ubah header menjadi sapaan sederhana.
- Tampilkan total anggota dalam card statistik yang lebih visual.
- Tambah quick actions:
  - Tambah Anggota
  - Lihat Daftar Anggota
- Tambah error state dengan tombol coba lagi bila data gagal dimuat.
- Tombol logout dibuat lebih jelas daripada ikon saja.

Acceptance Criteria:

- Dashboard langsung memberi akses ke aksi utama.
- Statistik tetap tampil dari `getAnggota()`.
- User bisa menuju tambah anggota dari dashboard.

---

### 5. Daftar Anggota Card List + Search

**File utama:** `src/pages/anggota/list.ts`

Tasks:

- Ganti tabel menjadi card list.
- Tambah search input lokal untuk cari nama anggota.
- Card anggota menampilkan:
  - Nama
  - Alamat singkat jika ada
  - No telepon jika ada
  - Tombol Edit
  - Tombol Hapus
- Empty state bila belum ada anggota.
- Empty search state bila pencarian tidak ditemukan.
- Hapus tetap memakai konfirmasi dulu, modal custom bisa di polish tahap akhir.

Acceptance Criteria:

- Daftar nyaman dibaca di HP.
- Search bekerja tanpa request ulang.
- Edit/hapus tetap berfungsi.

---

### 6. Form Tambah/Edit Anggota

**File utama:** `src/pages/anggota/form.ts`

Tasks:

- Refactor layout form menjadi lebih bersih.
- Label dan helper text lebih jelas.
- Alamat default tetap dipertahankan.
- Button simpan besar dan utama.
- Button batal sekunder.
- Loading state saat simpan tetap ada.
- Error validasi dibuat lebih ramah.

Acceptance Criteria:

- Form bisa dipakai nyaman di HP kecil.
- Validasi nama tetap berjalan.
- Create/update tetap berfungsi.

---

### 7. Feedback & Polish

**File utama:** bisa tambah helper di `src/components/` atau langsung sederhana di halaman.

Tasks:

- Tambah toast sederhana untuk pesan sukses/gagal.
- Tambah transisi ringan untuk card/list.
- Tambah custom confirm hapus bila waktu cukup.
- Audit accessibility sederhana:
  - label input benar
  - button punya teks jelas
  - kontras cukup

Acceptance Criteria:

- User mendapat feedback setelah aksi penting.
- Tidak ada animasi berat.
- Build berhasil.

## Urutan Eksekusi

1. Design system global.
2. App shell dan bottom nav.
3. Login.
4. Dashboard.
5. Daftar anggota.
6. Form anggota.
7. Polish dan build final.

## Definition of Done

Sprint dianggap selesai jika:

- `npm run build` berhasil.
- Login berfungsi.
- Dashboard memuat statistik.
- Tambah anggota berfungsi.
- Edit anggota berfungsi.
- Hapus anggota berfungsi.
- Search anggota berfungsi.
- UI nyaman di mobile width sekitar 360px.
- Progress dicatat di `AGENTS.md`.

## Risiko

- Bundle sudah cukup besar karena `@libsql/client`; hindari dependency visual tambahan.
- Koneksi Turso bisa lambat; state loading/error harus jelas.
- Pengguna low-end; animasi dan efek visual harus ringan.

## Catatan Implementasi

Tetap gunakan stack saat ini:

- Vite
- TypeScript
- DOM template string
- Hash routing
- PWA existing
- Turso/libSQL existing

Tidak perlu migrasi framework pada sprint ini.

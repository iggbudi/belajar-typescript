# Sprint Perbaikan Aplikasi Kegiatan PKK

Berdasarkan audit codebase 2026-06-27.  
Target: fix security, bugs, dan polish UI/UX secara bertahap.

---

## Sprint 1: Security & Foundation (Prioritas Tinggi)

> Estimasi: 1 sesi kerja  
> Goal: Tutup celah security, rapikan kode duplikat, fix bug kritis

### 1.1 Pindahkan DB ke Serverless API

**Problem:** `VITE_TURSO_URL` dan `VITE_TURSO_TOKEN` exposed di client bundle.  
**Fix:** Buat serverless function (Cloudflare Workers / Vercel Edge / Netlify Functions) sebagai proxy DB. Client hanya panggil API endpoint internal.

**Tasks:**
- [x] Buat folder `api/` dengan Vercel serverless functions
- [x] Pindahkan logic `execute()` dari `src/api/turso.ts` ke `api/_lib/db.ts`
- [x] Buat endpoint: `api/anggota/`, `api/kegiatan/`, `api/absensi`, `api/stats`
- [x] Client `src/api/anggota.ts` dan `src/api/kegiatan.ts` → fetch ke endpoint
- [x] Hapus `@libsql/client` dari client dependencies
- [x] Pindahkan `TURSO_URL` dan `TURSO_TOKEN` ke server env (Vercel)
- [x] Test: `tsc --noEmit` passed, build berhasil (41 KB JS, down from 122 KB)

**Acceptance Criteria:**
- Tidak ada Turso credentials di client bundle
- `grep -r "VITE_TURSO" dist/` return kosong
- Semua fitur tetap berfungsi

### 1.2 Real Auth dengan Token

**Problem:** Auth hanya localStorage flag, bisa di-bypass dari DevTools.  
**Fix:** Serverless endpoint validasi login → return JWT token → client simpan token → kirim di setiap request.

**Tasks:**
- [x] Buat endpoint `POST /api/auth/login` di Vercel serverless
- [x] Validasi username/password di server, return JWT (HMAC-SHA256 via Web Crypto API)
- [x] Client `src/auth.ts`: login → fetch ke `/api/auth/login`, simpan token di localStorage
- [x] Tambah header `Authorization: Bearer <token>` di setiap API call (`src/api/http.ts`)
- [x] Server: validasi JWT di setiap endpoint (`api/_lib/auth.ts`)
- [x] Token expiry: 24 jam, auto-logout saat 401 response
- [x] Hapus hardcoded `admin/admin123` dari client code (pindah ke server env)
- [x] Update `env.d.ts`: hapus `VITE_ADMIN_USERNAME` dan `VITE_ADMIN_PASSWORD`

**Acceptance Criteria:**
- Tidak ada password di client code
- DevTools localStorage edit tidak bisa bypass auth
- Token expired → redirect ke login

### 1.3 Fix `.gitignore`

**Tasks:**
- [x] Tambah `.env` ke `.gitignore` (selain `.env.local`)
- [x] Tambah `.env.example` dengan placeholder (tanpa nilai real)
- [x] Pastikan tidak ada file `.env` yang sudah ter-commit

**Acceptance Criteria:**
- `git status` tidak show `.env` file

### 1.4 Deduplicate Utility Functions

**Problem:** `esc()`, `shortText()`, `formatDate()` di-duplikasi di banyak file.  
**Fix:** Pindah ke `src/ui.ts`, hapus dari file lain.

**Tasks:**
- [x] Export `esc()`, `shortText()`, `formatDate()` dari `src/ui.ts`
- [x] Hapus duplikat dari: `anggota/list.ts`, `kegiatan/list.ts`, `absensi.ts`
- [x] Import dari `../../ui` di file yang butuh
- [x] Test: `tsc --noEmit` passed, build berhasil

**Acceptance Criteria:**
- Setiap fungsi hanya ada di 1 file
- Build berhasil tanpa error

### 1.5 Fix Guard Unmount Logic

**Problem:** `unmount()` dipanggil saat masuk route, bukan saat keluar. Plus double unmount dari hashchange listener.  
**Fix:** Hapus unmount dari guard, pindah ke hashchange handler.

**Tasks:**
- [x] Hapus parameter `unmount` dari `guard()` function
- [x] Pindahkan unmount logic ke `currentUnmount` module-level tracker
- [x] Track previous route unmount, unmount saat route berubah
- [x] Hapus duplikasi unmount di hashchange listener
- [x] Test: `tsc --noEmit` passed, build berhasil

**Acceptance Criteria:**
- `unmountAnggotaList()` hanya dipanggil saat LEAVING `/anggota`
- Tidak ada double unmount
- Pull-to-refresh cleanup jalan normal

---

## Sprint 2: Bug Fixes & Performance (Prioritas Sedang)

> Estimasi: 1 sesi kerja  
> Goal: Fix bugs, optimize performance, improve UX

### 2.1 Cache Badge Counts

**Problem:** 2 API calls setiap navigasi (badge counts di `mountNav()`).  
**Fix:** Fetch sekali, cache, invalidate on CRUD.

**Tasks:**
- [x] Buat badge cache dengan TTL (60 detik) di `main.ts`
- [x] `loadBadgeCounts()` gunakan cache
- [x] Invalidate cache setelah create/update/delete anggota atau kegiatan (`invalidateBadgeCache()`)
- [x] Badge update otomatis setelah CRUD (tanpa re-fetch)

**Acceptance Criteria:**
- Network tab: badge counts hanya 1 request per menit, bukan per navigasi
- Badge tetap update setelah CRUD

### 2.2 Fix Bottom Nav Re-render

**Problem:** Nav remove + re-add DOM setiap hashchange → flicker.  
**Fix:** Nav statis, update class active saja.

**Tasks:**
- [x] Nav dibuat sekali via `createNav()`, tidak re-render
- [x] Buat function `updateNavActive(hash)` yang hanya update class
- [x] Hapus `renderNav()` dan `oldNav.remove()` dari hashchange handler
- [x] Test: `tsc --noEmit` passed, build berhasil

**Acceptance Criteria:**
- Nav DOM tidak re-create saat pindah halaman
- Active state update instant

### 2.3 Absensi: 3 Status Buttons

**Problem:** UI hanya toggle hadir, padahal model support hadir/tidak_hadir/izin.  
**Fix:** Tambah 3 tombol status.

**Tasks:**
- [x] Update `absensi.ts`: 3 tombol (Hadir, Tidak Hadir, Izin) per anggota
- [x] Update CSS: `.btn-absensi-status` dengan `.active-hadir`, `.active-tidak`, `.active-izin`
- [x] Warna: Hijau (hadir), Merah (tidak hadir), Kuning (izin)
- [x] Update summary: tambah counter "Izin" (3 counters total)

**Acceptance Criteria:**
- 3 tombol terlihat jelas di mobile
- Status tersimpan benar di DB
- Summary menampilkan 3 counters

### 2.4 Add Pull-to-Refresh ke Semua List

**Tasks:**
- [x] Tambah pull-to-refresh di `kegiatan/list.ts`
- [x] Tambah pull-to-refresh di `dashboard.ts` + refactor ke `/api/stats`
- [x] Cleanup `unmountDashboard` dan `unmountKegiatanList` saat navigasi away

**Acceptance Criteria:**
- Pull-to-refresh jalan di anggota, kegiatan, dan dashboard

### 2.5 Add Back Button di Form Pages

**Tasks:**
- [ ] Tambah tombol "← Kembali" di `anggota/form.ts` (sudah ada "Batal", rename jadi "← Batal" konsisten)
- [ ] Tambah tombol "← Kembali" di `kegiatan/form.ts` (sudah ada, pastikan konsisten)
- [ ] Pastikan semua form punya 2 tombol: Simpan (primary) + Batal (secondary)

**Acceptance Criteria:**
- Semua form punya navigasi back yang jelas

### 2.6 Hapus Logout Redundan

**Problem:** Tombol 🚪 Keluar ada di header SETIAP halaman + di settings.  
**Fix:** Cukup di settings page saja.

**Tasks:**
- [x] Hapus `#logout-btn` dari: `dashboard.ts`, `anggota/list.ts`, `anggota/form.ts`, `kegiatan/list.ts`, `kegiatan/form.ts`, `absensi.ts`
- [x] Hapus `logout` import dari halaman yang tidak pakai
- [x] Nav auto-remove saat ke login route (`removeNav()`)

**Acceptance Criteria:**
- Logout hanya di settings page
- Tidak ada tombol logout di header halaman lain

---

## Sprint 3: UI/UX Polish (Prioritas Rendah)

> Estimasi: 1 sesi kerja  
> Goal: Improve UX, tambah fitur kecil yang impactful

### 3.1 Offline Indicator

**Tasks:**
- [x] Tambah banner "📡 Mode Offline — Data mungkin tidak terbaru" di atas app
- [x] Listen `window.addEventListener('online'/'offline')`
- [x] Sembunyikan banner saat online
- [x] Style: amber/yellow background, slide-down animation

**Acceptance Criteria:**
- Banner muncul saat offline, hilang saat online

### 3.2 Form Unsaved Changes Guard

**Tasks:**
- [x] Track dirty state di form (anggota & kegiatan) via `markDirty()`
- [x] Tambah confirm dialog saat navigate away jika form terisi (`confirmIfDirty()`)
- [x] Gunakan `beforeunload` untuk tab close (`initUnsavedGuard()`)
- [x] Clear dirty state on successful submit (`clearDirty()`)

**Acceptance Criteria:**
- User dapat warning jika form terisi dan mau pindah halaman

### 3.3 Search Highlight

**Tasks:**
- [x] Tambah `highlightMatch()` di `ui.ts`
- [x] Highlight nama anggota yang match dengan keyword
- [x] Highlight judul kegiatan yang match dengan keyword
- [x] Style: `<mark>` dengan background yellow (light) / amber (dark)

**Acceptance Criteria:**
- Keyword pencarian ter-highlight di hasil

### 3.4 Export/Print Daftar Anggota

**Tasks:**
- [x] Tambah tombol "📋 Export CSV" di toolbar anggota list
- [x] Generate CSV dari `anggotaCache` (Nama, Alamat, No Telepon)
- [x] Download sebagai `.csv` file dengan BOM untuk Excel compatibility

**Acceptance Criteria:**
- Klik export → download CSV dengan kolom: Nama, Alamat, No Telepon

### 3.5 Unsaved Form: Hapus Logout dari Header

Sudah ter-cover di Sprint 2.6.

### 3.6 Dark Mode

**Tasks:**
- [x] Tambah CSS variables untuk dark mode (`prefers-color-scheme: dark`)
- [x] Auto-detect system preference (tidak perlu toggle manual)
- [x] Override semua elemen: stat card, form, toast, absensi buttons, mark, offline banner
- [x] Test: `tsc --noEmit` passed, build berhasil

**Acceptance Criteria:**
- App readable di dark mode
- Tidak ada contrast issue

---

## Sprint 4: Architecture & Refactor (Backlog)

> Estimasi: 2+ sesi kerja  
> Goal: Long-term maintainability

### 4.1 Router Refactor

**Tasks:**
- [x] Support params: `route('/anggota/edit/:id', ...)` pattern
- [x] Auto-parse query string into params
- [x] 404 page untuk route tidak dikenal
- [x] Error boundary (try/catch di render, tampilkan error UI)
- [x] Page transition animation via CSS class
- [x] Update semua navigate call: `?id=N` → `/:id`

### 4.2 State Management Sederhana

**Tasks:**
- [ ] Buat simple reactive store (Pub/Sub pattern)
- [ ] Replace module-level cache dengan shared store
- [ ] Auto re-render component saat data berubah

### 4.3 Split CSS per Component

**Tasks:**
- [ ] `style.css` → `base.css` + `nav.css` + `login.css` + `dashboard.css` + `anggota.css` + `kegiatan.css` + `settings.css`
- [ ] Import semua di `main.ts`

### 4.4 Error Boundaries

**Tasks:**
- [x] Global try/catch di router render → tampilkan error UI
- [x] Page transition (sudah di 4.1)

### 4.5 TypeScript Strict Mode

**Tasks:**
- [ ] Hapus semua `as unknown as` casts di API layer
- [ ] Gunakan proper generic types
- [ ] Enable `noImplicitAny` (sudah di strict mode, tapi banyak cast)

---

## Checklist Per Sprint

| Sprint | Status | Catatan |
|--------|--------|---------|
| Sprint 1: Security & Foundation | ⬜ | |
| Sprint 2: Bug Fixes & Performance | ⬜ | |
| Sprint 3: UI/UX Polish | ⬜ | |
| Sprint 4: Architecture & Refactor | ⬜ | |

---

## Cara Pakai

1. Buka sprint yang aktif
2. Ambil task satu per satu, dari atas ke bawah
3. Centang `[x]` saat selesai
4. Test build setelah setiap task: `npm run build`
5. Commit setelah setiap task selesai
6. Pindah ke sprint berikutnya setelah semua task selesai

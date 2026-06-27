Ini adalah project belajar typescript



Setiap kali ada progress tambahkan dibagian akhir

## Progress
- 2026-06-27: Tambah model `oc/deepseek-v4-flash-free` ke provider `9router` di `~/.pi/agent/models.json`
- 2026-06-27: Migrasi dari CLI ke PWA. Stack: Vite + vite-plugin-pwa. Halaman web interaktif dengan service worker, manifest, offline support.
- 2026-06-27: Tambah login page (admin/admin123 via .env.local), hash-based routing (#/login, #/dashboard), auth guard + logout.
- 2026-06-27: Tambah CRUD anggota PKK + database Turso (libSQL/SQLite). API layer src/api/, halaman #/anggota, #/anggota/tambah, #/anggota/edit?id=N.
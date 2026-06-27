import { execute } from './turso';

export interface Kegiatan {
  id: number;
  judul: string;
  deskripsi: string;
  tanggal: string;
  lokasi: string;
  created_at: string;
  updated_at: string;
}

export interface Absensi {
  id: number;
  kegiatan_id: number;
  anggota_id: number;
  status: 'hadir' | 'tidak_hadir' | 'izin';
  keterangan: string;
  created_at: string;
}

export interface AnggotaWithAbsensi {
  id: number;
  nama: string;
  alamat: string;
  no_telepon: string;
  absensi_id?: number;
  status?: 'hadir' | 'tidak_hadir' | 'izin';
}

// ═══════════════════════════════════════════
// KEGIATAN CRUD
// ═══════════════════════════════════════════

export async function initKegiatanTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS kegiatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      deskripsi TEXT DEFAULT '',
      tanggal TEXT NOT NULL,
      lokasi TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export async function initAbsensiTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS absensi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kegiatan_id INTEGER NOT NULL,
      anggota_id INTEGER NOT NULL,
      status TEXT DEFAULT 'hadir',
      keterangan TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
      FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
      UNIQUE(kegiatan_id, anggota_id)
    )
  `);
}

export async function getKegiatan(): Promise<Kegiatan[]> {
  try {
    const { rows } = await execute('SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC');
    return rows as unknown as Kegiatan[];
  } catch (err) {
    // If table doesn't exist, try to create it
    const error = err as Error;
    if (error.message.includes('no such table')) {
      await initKegiatanTable();
      await initAbsensiTable();
      const { rows } = await execute('SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC');
      return rows as unknown as Kegiatan[];
    }
    throw err;
  }
}

export async function getKegiatanById(id: number): Promise<Kegiatan | null> {
  const { rows } = await execute('SELECT * FROM kegiatan WHERE id = ?', [id]);
  return (rows[0] as unknown as Kegiatan) ?? null;
}

export async function createKegiatan(data: {
  judul: string;
  deskripsi?: string;
  tanggal: string;
  lokasi?: string;
}): Promise<Kegiatan> {
  await initKegiatanTable();
  const { result } = await execute(
    'INSERT INTO kegiatan (judul, deskripsi, tanggal, lokasi) VALUES (?, ?, ?, ?) RETURNING *',
    [data.judul, data.deskripsi ?? '', data.tanggal, data.lokasi ?? '']
  );
  return result.rows[0] as unknown as Kegiatan;
}

export async function updateKegiatan(id: number, data: {
  judul?: string;
  deskripsi?: string;
  tanggal?: string;
  lokasi?: string;
}): Promise<Kegiatan> {
  const sets: string[] = [];
  const args: unknown[] = [];
  
  if (data.judul !== undefined) { sets.push('judul = ?'); args.push(data.judul); }
  if (data.deskripsi !== undefined) { sets.push('deskripsi = ?'); args.push(data.deskripsi); }
  if (data.tanggal !== undefined) { sets.push('tanggal = ?'); args.push(data.tanggal); }
  if (data.lokasi !== undefined) { sets.push('lokasi = ?'); args.push(data.lokasi); }
  
  sets.push("updated_at = datetime('now')");
  args.push(id);
  
  const { result } = await execute(
    `UPDATE kegiatan SET ${sets.join(', ')} WHERE id = ? RETURNING *`,
    args
  );
  return result.rows[0] as unknown as Kegiatan;
}

export async function deleteKegiatan(id: number): Promise<void> {
  // Delete absensi first
  await execute('DELETE FROM absensi WHERE kegiatan_id = ?', [id]);
  await execute('DELETE FROM kegiatan WHERE id = ?', [id]);
}

// ═══════════════════════════════════════════
// ABSENSI
// ═══════════════════════════════════════════

export async function getAbsensiByKegiatan(kegiatanId: number): Promise<Absensi[]> {
  try {
    const { rows } = await execute(
      'SELECT * FROM absensi WHERE kegiatan_id = ?',
      [kegiatanId]
    );
    return rows as unknown as Absensi[];
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('no such table')) {
      await initAbsensiTable();
      return [];
    }
    throw err;
  }
}

export async function getAnggotaWithAbsensi(kegiatanId: number): Promise<AnggotaWithAbsensi[]> {
  try {
    const { rows } = await execute(`
      SELECT 
        a.id,
        a.nama,
        a.alamat,
        a.no_telepon,
        abs.id as absensi_id,
        abs.status
      FROM anggota a
      LEFT JOIN absensi abs ON a.id = abs.anggota_id AND abs.kegiatan_id = ?
      ORDER BY a.nama ASC
    `, [kegiatanId]);
    return rows as unknown as AnggotaWithAbsensi[];
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('no such table')) {
      await initAbsensiTable();
      // Fallback: just get anggota
      const { rows } = await execute('SELECT * FROM anggota ORDER BY nama ASC');
      return rows as unknown as AnggotaWithAbsensi[];
    }
    throw err;
  }
}

export async function setAbsensi(data: {
  kegiatan_id: number;
  anggota_id: number;
  status: 'hadir' | 'tidak_hadir' | 'izin';
  keterangan?: string;
}): Promise<Absensi> {
  await initAbsensiTable();
  
  // Check if absensi already exists
  const existing = await execute(
    'SELECT id FROM absensi WHERE kegiatan_id = ? AND anggota_id = ?',
    [data.kegiatan_id, data.anggota_id]
  );
  
  if (existing.rows.length > 0) {
    // Update existing
    const { result } = await execute(
      'UPDATE absensi SET status = ?, keterangan = ? WHERE kegiatan_id = ? AND anggota_id = ? RETURNING *',
      [data.status, data.keterangan ?? '', data.kegiatan_id, data.anggota_id]
    );
    return result.rows[0] as unknown as Absensi;
  } else {
    // Insert new
    const { result } = await execute(
      'INSERT INTO absensi (kegiatan_id, anggota_id, status, keterangan) VALUES (?, ?, ?, ?) RETURNING *',
      [data.kegiatan_id, data.anggota_id, data.status, data.keterangan ?? '']
    );
    return result.rows[0] as unknown as Absensi;
  }
}

export async function getStatsKegiatan(): Promise<{
  total: number;
  bulanIni: number;
  totalHadir: number;
}> {
  try {
    // Total kegiatan
    const totalResult = await execute('SELECT COUNT(*) as total FROM kegiatan');
    const total = (totalResult.rows[0] as any)?.total ?? 0;
    
    // Kegiatan bulan ini
    const bulanIniResult = await execute(`
      SELECT COUNT(*) as total FROM kegiatan 
      WHERE strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now')
    `);
    const bulanIni = (bulanIniResult.rows[0] as any)?.total ?? 0;
    
    // Total kehadiran
    const hadirResult = await execute(`
      SELECT COUNT(*) as total FROM absensi WHERE status = 'hadir'
    `);
    const totalHadir = (hadirResult.rows[0] as any)?.total ?? 0;
    
    return { total, bulanIni, totalHadir };
  } catch (err) {
    return { total: 0, bulanIni: 0, totalHadir: 0 };
  }
}

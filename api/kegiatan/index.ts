import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json } from '../_lib/cors';
import { execute } from '../_lib/db';
import { verifyToken } from '../_lib/auth';

async function ensureTables() {
  await execute(`CREATE TABLE IF NOT EXISTS kegiatan (id INTEGER PRIMARY KEY AUTOINCREMENT, judul TEXT NOT NULL, deskripsi TEXT DEFAULT '', tanggal TEXT NOT NULL, lokasi TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
  await execute(`CREATE TABLE IF NOT EXISTS absensi (id INTEGER PRIMARY KEY AUTOINCREMENT, kegiatan_id INTEGER NOT NULL, anggota_id INTEGER NOT NULL, status TEXT DEFAULT 'hadir', keterangan TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE, FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE, UNIQUE(kegiatan_id, anggota_id))`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization').end();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token))) {
    return json(res, { error: 'Unauthorized' }, 401);
  }

  if (req.method === 'GET') {
    try {
      const rows = await execute('SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC');
      return json(res, rows);
    } catch (e: any) {
      if (e.message?.includes('no such table')) {
        await ensureTables();
        return json(res, []);
      }
      throw e;
    }
  }

  if (req.method === 'POST') {
    const { judul, deskripsi, tanggal, lokasi } = req.body ?? {};
    if (!judul || judul.trim().length < 3) return json(res, { error: 'Judul minimal 3 huruf' }, 400);
    if (!tanggal) return json(res, { error: 'Tanggal wajib diisi' }, 400);
    await ensureTables();
    const rows = await execute(
      'INSERT INTO kegiatan (judul, deskripsi, tanggal, lokasi) VALUES (?, ?, ?, ?) RETURNING *',
      [judul.trim(), deskripsi ?? '', tanggal, lokasi ?? '']
    );
    return json(res, rows[0], 201);
  }

  return json(res, { error: 'Method not allowed' }, 405);
}

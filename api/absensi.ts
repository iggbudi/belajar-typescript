import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json } from '../_lib/cors';
import { execute } from '../_lib/db';
import { verifyToken } from '../_lib/auth';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS absensi (id INTEGER PRIMARY KEY AUTOINCREMENT, kegiatan_id INTEGER NOT NULL, anggota_id INTEGER NOT NULL, status TEXT DEFAULT 'hadir', keterangan TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE, FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE, UNIQUE(kegiatan_id, anggota_id))`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization').end();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token))) {
    return json(res, { error: 'Unauthorized' }, 401);
  }

  if (req.method === 'GET') {
    const kegiatanId = Number(req.query.kegiatan_id);
    if (!kegiatanId) return json(res, { error: 'kegiatan_id wajib' }, 400);
    try {
      const rows = await execute(`
        SELECT a.id, a.nama, a.alamat, a.no_telepon,
               abs.id as absensi_id, abs.status
        FROM anggota a
        LEFT JOIN absensi abs ON a.id = abs.anggota_id AND abs.kegiatan_id = ?
        ORDER BY a.nama ASC
      `, [kegiatanId]);
      return json(res, rows);
    } catch (e: any) {
      if (e.message?.includes('no such table')) {
        await ensureTable();
        const rows = await execute('SELECT id, nama, alamat, no_telepon FROM anggota ORDER BY nama ASC');
        return json(res, rows);
      }
      throw e;
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { kegiatan_id, anggota_id, status, keterangan } = req.body ?? {};
    if (!kegiatan_id || !anggota_id) return json(res, { error: 'kegiatan_id dan anggota_id wajib' }, 400);
    await ensureTable();

    // Upsert: check existing
    const existing = await execute(
      'SELECT id FROM absensi WHERE kegiatan_id = ? AND anggota_id = ?',
      [kegiatan_id, anggota_id]
    );

    let rows;
    if (existing.length > 0) {
      rows = await execute(
        'UPDATE absensi SET status = ?, keterangan = ? WHERE kegiatan_id = ? AND anggota_id = ? RETURNING *',
        [status ?? 'hadir', keterangan ?? '', kegiatan_id, anggota_id]
      );
    } else {
      rows = await execute(
        'INSERT INTO absensi (kegiatan_id, anggota_id, status, keterangan) VALUES (?, ?, ?, ?) RETURNING *',
        [kegiatan_id, anggota_id, status ?? 'hadir', keterangan ?? '']
      );
    }
    return json(res, rows[0]);
  }

  return json(res, { error: 'Method not allowed' }, 405);
}

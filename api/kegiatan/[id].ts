import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json } from '../_lib/cors';
import { execute } from '../_lib/db';
import { verifyToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization').end();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token))) {
    return json(res, { error: 'Unauthorized' }, 401);
  }

  const id = Number(req.query.id);
  if (!id) return json(res, { error: 'ID tidak valid' }, 400);

  if (req.method === 'GET') {
    const rows = await execute('SELECT * FROM kegiatan WHERE id = ?', [id]);
    return rows.length ? json(res, rows[0]) : json(res, { error: 'Tidak ditemukan' }, 404);
  }

  if (req.method === 'PUT') {
    const { judul, deskripsi, tanggal, lokasi } = req.body ?? {};
    const sets: string[] = [];
    const args: unknown[] = [];
    if (judul !== undefined) { sets.push('judul = ?'); args.push(judul); }
    if (deskripsi !== undefined) { sets.push('deskripsi = ?'); args.push(deskripsi); }
    if (tanggal !== undefined) { sets.push('tanggal = ?'); args.push(tanggal); }
    if (lokasi !== undefined) { sets.push('lokasi = ?'); args.push(lokasi); }
    sets.push("updated_at = datetime('now')");
    args.push(id);
    const rows = await execute(`UPDATE kegiatan SET ${sets.join(', ')} WHERE id = ? RETURNING *`, args);
    return rows.length ? json(res, rows[0]) : json(res, { error: 'Tidak ditemukan' }, 404);
  }

  if (req.method === 'DELETE') {
    await execute('DELETE FROM absensi WHERE kegiatan_id = ?', [id]);
    await execute('DELETE FROM kegiatan WHERE id = ?', [id]);
    return json(res, { ok: true });
  }

  return json(res, { error: 'Method not allowed' }, 405);
}

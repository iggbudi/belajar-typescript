import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json } from '../_lib/cors';
import { execute } from '../_lib/db';
import { verifyToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization').end();
  }

  if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405);

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token))) {
    return json(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const anggotaRows = await execute('SELECT COUNT(*) as total FROM anggota');
    const totalAnggota = (anggotaRows[0] as any)?.total ?? 0;

    const totalRows = await execute('SELECT COUNT(*) as total FROM kegiatan');
    const total = (totalRows[0] as any)?.total ?? 0;

    const bulanRows = await execute(`SELECT COUNT(*) as total FROM kegiatan WHERE strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now')`);
    const bulanIni = (bulanRows[0] as any)?.total ?? 0;

    const hadirRows = await execute(`SELECT COUNT(*) as total FROM absensi WHERE status = 'hadir'`);
    const totalHadir = (hadirRows[0] as any)?.total ?? 0;

    return json(res, { totalAnggota, total, bulanIni, totalHadir });
  } catch {
    return json(res, { totalAnggota: 0, total: 0, bulanIni: 0, totalHadir: 0 });
  }
}

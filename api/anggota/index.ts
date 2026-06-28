import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, handleOptions } from '../_lib/cors';
import { execute } from '../_lib/db';
import { verifyToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);

  // Auth check
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token))) {
    return json(res, { error: 'Unauthorized' }, 401);
  }

  if (req.method === 'GET') {
    const rows = await execute('SELECT * FROM anggota ORDER BY id DESC');
    return json(res, rows);
  }

  if (req.method === 'POST') {
    const { nama, alamat, no_telepon } = req.body ?? {};
    if (!nama || nama.trim().length < 3) {
      return json(res, { error: 'Nama minimal 3 huruf' }, 400);
    }
    const rows = await execute(
      'INSERT INTO anggota (nama, alamat, no_telepon) VALUES (?, ?, ?) RETURNING *',
      [nama.trim(), alamat ?? '', no_telepon ?? '']
    );
    return json(res, rows[0], 201);
  }

  return json(res, { error: 'Method not allowed' }, 405);
}

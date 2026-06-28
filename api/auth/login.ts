import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signToken } from '../_lib/auth';
import { json, handleOptions } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type').end();

  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const { username, password } = req.body ?? {};
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUser || password !== adminPass) {
    return json(res, { error: 'Username atau password salah' }, 401);
  }

  const token = await signToken({ sub: username, role: 'admin' });
  return json(res, { token, user: { username, role: 'admin' } });
}

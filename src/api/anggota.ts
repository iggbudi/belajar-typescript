import { execute } from './turso';

export interface Anggota {
  id: number;
  nama: string;
  alamat: string;
  no_telepon: string;
  created_at: string;
  updated_at: string;
}

export async function getAnggota(): Promise<Anggota[]> {
  const { rows } = await execute('SELECT * FROM anggota ORDER BY id DESC');
  return rows as unknown as Anggota[];
}

export async function getAnggotaById(id: number): Promise<Anggota | null> {
  const { rows } = await execute('SELECT * FROM anggota WHERE id = ?', [id]);
  return (rows[0] as unknown as Anggota) ?? null;
}

export async function createAnggota(data: { nama: string; alamat?: string; no_telepon?: string }): Promise<Anggota> {
  const { result } = await execute(
    'INSERT INTO anggota (nama, alamat, no_telepon) VALUES (?, ?, ?) RETURNING *',
    [data.nama, data.alamat ?? '', data.no_telepon ?? '']
  );
  return result.rows[0] as unknown as Anggota;
}

export async function updateAnggota(id: number, data: { nama?: string; alamat?: string; no_telepon?: string }): Promise<Anggota> {
  const sets: string[] = [];
  const args: unknown[] = [];
  if (data.nama !== undefined) { sets.push('nama = ?'); args.push(data.nama); }
  if (data.alamat !== undefined) { sets.push('alamat = ?'); args.push(data.alamat); }
  if (data.no_telepon !== undefined) { sets.push('no_telepon = ?'); args.push(data.no_telepon); }
  sets.push("updated_at = datetime('now')");
  args.push(id);
  const { result } = await execute(
    `UPDATE anggota SET ${sets.join(', ')} WHERE id = ? RETURNING *`,
    args
  );
  return result.rows[0] as unknown as Anggota;
}

export async function deleteAnggota(id: number): Promise<void> {
  await execute('DELETE FROM anggota WHERE id = ?', [id]);
}

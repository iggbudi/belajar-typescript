import { apiGet, apiPost, apiPut, apiDelete } from './http';

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

export async function getKegiatan(): Promise<Kegiatan[]> {
  return apiGet<Kegiatan[]>('/kegiatan');
}

export async function getKegiatanById(id: number): Promise<Kegiatan | null> {
  try {
    return await apiGet<Kegiatan>(`/kegiatan/${id}`);
  } catch (e: any) {
    if (e.message?.includes('Tidak ditemukan')) return null;
    throw e;
  }
}

export async function createKegiatan(data: { judul: string; deskripsi?: string; tanggal: string; lokasi?: string }): Promise<Kegiatan> {
  return apiPost<Kegiatan>('/kegiatan', data);
}

export async function updateKegiatan(id: number, data: { judul?: string; deskripsi?: string; tanggal?: string; lokasi?: string }): Promise<Kegiatan> {
  return apiPut<Kegiatan>(`/kegiatan/${id}`, data);
}

export async function deleteKegiatan(id: number): Promise<void> {
  await apiDelete(`/kegiatan/${id}`);
}

export async function getAnggotaWithAbsensi(kegiatanId: number): Promise<AnggotaWithAbsensi[]> {
  return apiGet<AnggotaWithAbsensi[]>(`/absensi?kegiatan_id=${kegiatanId}`);
}

export async function setAbsensi(data: {
  kegiatan_id: number;
  anggota_id: number;
  status: 'hadir' | 'tidak_hadir' | 'izin';
  keterangan?: string;
}): Promise<Absensi> {
  return apiPost<Absensi>('/absensi', data);
}

export async function getStatsKegiatan(): Promise<{ total: number; bulanIni: number; totalHadir: number }> {
  try {
    const stats = await apiGet<{ totalAnggota: number; total: number; bulanIni: number; totalHadir: number }>('/stats');
    return { total: stats.total, bulanIni: stats.bulanIni, totalHadir: stats.totalHadir };
  } catch {
    return { total: 0, bulanIni: 0, totalHadir: 0 };
  }
}

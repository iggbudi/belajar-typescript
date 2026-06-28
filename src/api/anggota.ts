import { apiGet, apiPost, apiPut, apiDelete } from './http';

export interface Anggota {
  id: number;
  nama: string;
  alamat: string;
  no_telepon: string;
  created_at: string;
  updated_at: string;
}

export async function getAnggota(): Promise<Anggota[]> {
  return apiGet<Anggota[]>('/anggota');
}

export async function getAnggotaById(id: number): Promise<Anggota | null> {
  try {
    return await apiGet<Anggota>(`/anggota/${id}`);
  } catch (e: any) {
    if (e.message?.includes('Tidak ditemukan')) return null;
    throw e;
  }
}

export async function createAnggota(data: { nama: string; alamat?: string; no_telepon?: string }): Promise<Anggota> {
  return apiPost<Anggota>('/anggota', data);
}

export async function updateAnggota(id: number, data: { nama?: string; alamat?: string; no_telepon?: string }): Promise<Anggota> {
  return apiPut<Anggota>(`/anggota/${id}`, data);
}

export async function deleteAnggota(id: number): Promise<void> {
  await apiDelete(`/anggota/${id}`);
}

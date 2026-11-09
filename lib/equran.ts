// Pengunduh data API EQuran.id beserta penyaringnya: hanya kolom yang dipakai
// situs yang disimpan ke data/*.json. Modul ini sengaja tanpa impor lain supaya
// bisa dipakai juga oleh scripts/perbarui-data.ts (dijalankan langsung oleh Node).

const HOST = 'https://equran.id';
const HEADER = { 'Content-Type': 'application/json', 'User-Agent': 'Nawaitu-Web/2.0' };

export async function panggilEquran<T>(path: string, body?: object): Promise<T> {
  for (let coba = 1; ; coba++) {
    try {
      const res = await fetch(HOST + path, {
        method: body ? 'POST' : 'GET',
        headers: HEADER,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      // Galat internal Next.js (punya "digest") harus diteruskan apa adanya.
      if ((e as { digest?: unknown })?.digest) throw e;
      if (coba >= 2) throw new Error(`EQuran ${path}: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 800));
    }
  }
}

const hariIni = () => new Date().toISOString().slice(0, 10);

// ---------- Wilayah ----------

export type ArsipWilayah = { sumber: string; diperbarui: string; provinsi: Record<string, string[]> };

export async function unduhWilayah(): Promise<ArsipWilayah> {
  const prov = (await panggilEquran<{ data: string[] }>('/api/v2/shalat/provinsi')).data;
  if (!Array.isArray(prov) || !prov.length) throw new Error('Daftar provinsi kosong');
  const per = await Promise.all(
    prov.map(async (p) => [p, (await panggilEquran<{ data: string[] }>('/api/v2/shalat/kabkota', { provinsi: p })).data] as const),
  );
  for (const [p, kab] of per) if (!Array.isArray(kab) || !kab.length) throw new Error(`Kab/kota ${p} kosong`);
  return { sumber: 'EQuran.id (Kemenag RI)', diperbarui: hariIni(), provinsi: Object.fromEntries(per) };
}

// ---------- Al-Qur'an (per surat) ----------

export type ArsipSurat = {
  sumber: string;
  nomor: number;
  nama: string; // Arab
  namaLatin: string;
  arti: string;
  tempatTurun: string;
  jumlahAyat: number;
  ayat: { nomor: number; arab: string; latin: string; terjemah: string }[];
};

type AyatMentah = { nomorAyat?: number; teksArab?: string; teksLatin?: string; teksIndonesia?: string };

export async function unduhSurat(nomor: number): Promise<ArsipSurat> {
  const d = (await panggilEquran<{ data?: Record<string, unknown> & { ayat?: AyatMentah[] } }>(`/api/v2/surat/${nomor}`)).data;
  if (!d || !Array.isArray(d.ayat) || !d.ayat.length) throw new Error(`Surat ${nomor} kosong`);
  const ayat = d.ayat
    .filter((a) => typeof a?.nomorAyat === 'number' && typeof a.teksArab === 'string' && typeof a.teksIndonesia === 'string')
    .map((a) => ({ nomor: a.nomorAyat!, arab: a.teksArab!.trim(), latin: String(a.teksLatin ?? '').trim(), terjemah: a.teksIndonesia!.trim() }));
  const jumlahAyat = Number(d.jumlahAyat) || ayat.length;
  if (ayat.length !== jumlahAyat) throw new Error(`Surat ${nomor} tidak lengkap (${ayat.length}/${jumlahAyat})`);
  return {
    sumber: 'EQuran.id (Kemenag RI)',
    nomor,
    nama: String(d.nama ?? ''),
    namaLatin: String(d.namaLatin ?? `Surat ${nomor}`),
    arti: String(d.arti ?? ''),
    tempatTurun: String(d.tempatTurun ?? ''),
    jumlahAyat,
    ayat,
  };
}

// ---------- Jadwal shalat bulanan ----------

export const KUNCI_JADWAL = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;
export type JadwalBulan = Record<string, Record<(typeof KUNCI_JADWAL)[number], string>>;

/** {"2026-10-11": {subuh: "04:18", ...}}. Baris rusak dilewati. */
export async function unduhJadwalBulan(provinsi: string, kabkota: string, tahun: number, bulan: number): Promise<JadwalBulan> {
  const json = await panggilEquran<{ data?: { jadwal?: unknown } }>('/api/v2/shalat', { provinsi, kabkota, bulan, tahun });
  const hasil: JadwalBulan = {};
  const jadwal = json?.data?.jadwal;
  if (!Array.isArray(jadwal)) return hasil;
  for (const baris of jadwal) {
    const tgl = baris?.tanggal_lengkap;
    if (typeof tgl !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) continue;
    const w: Record<string, string> = {};
    for (const k of KUNCI_JADWAL) {
      const v = baris[k];
      if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) w[k] = v.padStart(5, '0');
    }
    if (Object.keys(w).length === KUNCI_JADWAL.length) hasil[tgl] = w as JadwalBulan[string];
  }
  return hasil;
}

/** Jadwal sebulan dianggap lengkap bila semua tanggal di bulan itu ada. */
export function jadwalLengkap(j: JadwalBulan, tahun: number, bulan: number) {
  const hari = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const awalan = `${tahun}-${String(bulan).padStart(2, '0')}-`;
  return Object.keys(j).filter((k) => k.startsWith(awalan)).length === hari;
}

export const slugArsip = (s: string) =>
  s.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Lokasi berkas arsip, relatif terhadap folder data/. */
export const berkasArsip = {
  wilayah: () => 'wilayah.json',
  surat: (nomor: number) => `quran/${String(nomor).padStart(3, '0')}.json`,
  jadwal: (provinsi: string, kabkota: string, tahun: number, bulan: number) =>
    `jadwal/${tahun}-${String(bulan).padStart(2, '0')}/${slugArsip(provinsi)}/${slugArsip(kabkota)}.json`,
};

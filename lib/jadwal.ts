// Jadwal shalat resmi Kemenag RI dari API EQuran.id, sama seperti aplikasi
// Nawaitu (lib/features/shalat/jadwal_online.dart). Semua panggilan ke API
// dilakukan di server dan di-cache, karena API hanya menerima POST dari browser
// tanpa CORS.
import 'server-only';
import { unstable_cache } from 'next/cache';
import { KUNCI_WAKTU, type JadwalHari, type Waktu } from './waktu';

const HOST = 'https://equran.id';
const HEADER = { 'Content-Type': 'application/json', 'User-Agent': 'Nawaitu-Web/2.0' };

export type Wilayah = {
  slug: string;
  nama: string; // nama dari API, mis. "Kota Bandung" atau "Kab. Bandung"
  namaTampil: string; // "Kota Bandung" / "Kabupaten Bandung"
  provinsi: string;
  zona: 'WIB' | 'WITA' | 'WIT';
  tz: number;
};

async function panggil<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(HOST + path, {
    method: body ? 'POST' : 'GET',
    headers: HEADER,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // cache diatur oleh unstable_cache di bawah
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`EQuran ${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------- Wilayah ----------

const WITA = ['bali', 'nusa tenggara', 'kalimantan selatan', 'kalimantan timur', 'kalimantan utara', 'sulawesi', 'gorontalo'];
const WIT = ['maluku', 'papua'];
function zonaProvinsi(p: string): Wilayah['zona'] {
  const n = p.toLowerCase();
  if (WIT.some((x) => n.includes(x))) return 'WIT';
  if (WITA.some((x) => n.includes(x))) return 'WITA';
  return 'WIB';
}
const TZ = { WIB: 7, WITA: 8, WIT: 9 } as const;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function namaTampil(nama: string) {
  return nama.replace(/^Kab\.\s*/i, 'Kabupaten ');
}

/** Hilangkan penanda jenis wilayah: "Kota Bogor" -> "bogor", "Kab. Aceh Barat" -> "acehbarat". */
export function normalisasiWilayah(s: string) {
  return s
    .toLowerCase()
    .replace(/\b(kabupaten|kab\.?|kota administrasi|kota adm\.?|kota|city|regency)(?![a-z])/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Cari wilayah yang paling cocok dengan [petunjuk], mis. "Kota Bogor", "Bogor",
 * atau "Kota Administrasi Jakarta Selatan". Bila petunjuk tidak menyebut "kab",
 * kota diutamakan. Port dari cocokkanKabKota di aplikasi.
 */
export function cocokkanWilayah(petunjuk: string, daftar: Wilayah[]): Wilayah | null {
  const inti = normalisasiWilayah(petunjuk);
  if (!inti) return null;
  const mauKab = /\bkab(upaten|\.)?/i.test(petunjuk);
  const urut = (l: Wilayah[]) =>
    l.sort((a, b) => Number(a.nama.toLowerCase().startsWith('kab') !== mauKab) - Number(b.nama.toLowerCase().startsWith('kab') !== mauKab));
  const persis = urut(daftar.filter((w) => normalisasiWilayah(w.nama) === inti));
  if (persis.length) return persis[0];
  const memuat = urut(
    daftar.filter((w) => {
      const x = normalisasiWilayah(w.nama);
      return x.length >= 4 && (inti.includes(x) || x.includes(inti));
    }),
  );
  return memuat[0] ?? null;
}

/** Semua kabupaten/kota dari API, diunduh sekali lalu disimpan 30 hari. */
export const daftarWilayah = unstable_cache(
  async (): Promise<Wilayah[]> => {
    const prov = (await panggil<{ data: string[] }>('/api/v2/shalat/provinsi')).data;
    const per = await Promise.all(
      prov.map(async (p) => ({ p, kab: (await panggil<{ data: string[] }>('/api/v2/shalat/kabkota', { provinsi: p })).data })),
    );
    const hasil: Wilayah[] = [];
    for (const { p, kab } of per) {
      for (const nama of kab) {
        const zona = zonaProvinsi(p);
        hasil.push({ slug: slugify(namaTampil(nama)), nama, namaTampil: namaTampil(nama), provinsi: p, zona, tz: TZ[zona] });
      }
    }
    // Nama kembar di provinsi berbeda: tambahkan nama provinsi pada slug.
    const hitung = new Map<string, number>();
    for (const w of hasil) hitung.set(w.slug, (hitung.get(w.slug) ?? 0) + 1);
    for (const w of hasil) if (hitung.get(w.slug)! > 1) w.slug = `${w.slug}-${slugify(w.provinsi)}`;
    return hasil;
  },
  ['equran-wilayah-v1'],
  { revalidate: 60 * 60 * 24 * 30 },
);

export async function wilayahDariSlug(slug: string) {
  return (await daftarWilayah()).find((w) => w.slug === slug) ?? null;
}

// ---------- Jadwal ----------

/** Ubah respons bulanan menjadi {"2026-10-11": {subuh: "04:18", ...}}. Baris rusak dilewati. */
function parseJadwalBulan(json: unknown): Record<string, JadwalHari> {
  const hasil: Record<string, JadwalHari> = {};
  const jadwal = (json as { data?: { jadwal?: unknown } })?.data?.jadwal;
  if (!Array.isArray(jadwal)) return hasil;
  for (const baris of jadwal) {
    const tgl = baris?.tanggal_lengkap;
    if (typeof tgl !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) continue;
    const w: Partial<JadwalHari> = {};
    for (const k of KUNCI_WAKTU) {
      const v = baris[k];
      if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) w[k as Waktu] = v.padStart(5, '0');
    }
    if (Object.keys(w).length === KUNCI_WAKTU.length) hasil[tgl] = w as JadwalHari;
  }
  return hasil;
}

const jadwalBulan = unstable_cache(
  async (provinsi: string, kabkota: string, tahun: number, bulan: number) =>
    parseJadwalBulan(await panggil('/api/v2/shalat', { provinsi, kabkota, bulan, tahun })),
  ['equran-jadwal-v1'],
  { revalidate: 60 * 60 * 24 * 7 },
);

/**
 * Jadwal [jumlahBulan] bulan mulai bulan [awal] (waktu daerah). Bulan pertama
 * wajib ada; bulan berikutnya yang belum tersedia dilewati.
 */
export async function jadwalWilayah(w: Wilayah, jumlahBulan = 2, awal = new Date(Date.now() + w.tz * 3600e3)) {
  const hasil: Record<string, JadwalHari> = {};
  for (let i = 0; i < jumlahBulan; i++) {
    const d = new Date(Date.UTC(awal.getUTCFullYear(), awal.getUTCMonth() + i, 1));
    try {
      Object.assign(hasil, await jadwalBulan(w.provinsi, w.nama, d.getUTCFullYear(), d.getUTCMonth() + 1));
    } catch (e) {
      if (i === 0) throw e;
      break;
    }
  }
  return hasil;
}

/** Wilayah bawaan bila pengunjung belum memilih kota. */
export const SLUG_BAWAAN = 'kota-jakarta';

/** Kota besar yang dibuat saat build; kota lain dibuat saat pertama dikunjungi. */
export const KOTA_POPULER = [
  'kota-jakarta', 'kota-surabaya', 'kota-bandung', 'kota-medan', 'kota-semarang', 'kota-makassar',
  'kota-yogyakarta', 'kota-bekasi', 'kota-depok', 'kota-tangerang', 'kota-bogor', 'kota-palembang',
  'kota-malang', 'kota-pekanbaru', 'kota-denpasar', 'kota-banda-aceh',
];

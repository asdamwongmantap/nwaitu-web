// Jadwal shalat resmi Kemenag RI dari API EQuran.id, sama seperti aplikasi
// Nawaitu (lib/features/shalat/jadwal_online.dart). Daftar kab/kota dan jadwal
// bulanan disimpan di data/*.json (lib/arsip.ts) dan diambil ulang dari API
// hanya setelah masa berlakunya lewat. API dipanggil dari server karena hanya
// menerima POST tanpa CORS.
import 'server-only';
import { MASA_BERLAKU, arsip } from './arsip';
import { berkasArsip, jadwalLengkap, unduhJadwalBulan, unduhWilayah } from './equran';
import type { JadwalHari } from './waktu';

export type Wilayah = {
  slug: string;
  nama: string; // nama dari API, mis. "Kota Bandung" atau "Kab. Bandung"
  namaTampil: string; // "Kota Bandung" / "Kabupaten Bandung"
  provinsi: string;
  zona: 'WIB' | 'WITA' | 'WIT';
  tz: number;
};

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

let cacheDaftar: { sumber: unknown; daftar: Wilayah[] } | null = null;

/** Semua kabupaten/kota (data/wilayah.json, diperbarui dari API tiap MASA_BERLAKU.wilayah). */
async function semuaWilayah(): Promise<Wilayah[]> {
  const data = await arsip(berkasArsip.wilayah(), { masa: MASA_BERLAKU.wilayah, ambil: unduhWilayah });
  if (cacheDaftar?.sumber === data) return cacheDaftar.daftar;
  const hasil: Wilayah[] = [];
  for (const [p, kab] of Object.entries(data.provinsi)) {
    for (const nama of kab) {
      const zona = zonaProvinsi(p);
      hasil.push({ slug: slugify(namaTampil(nama)), nama, namaTampil: namaTampil(nama), provinsi: p, zona, tz: TZ[zona] });
    }
  }
  // Nama kembar di provinsi berbeda: tambahkan nama provinsi pada slug.
  const hitung = new Map<string, number>();
  for (const w of hasil) hitung.set(w.slug, (hitung.get(w.slug) ?? 0) + 1);
  for (const w of hasil) if (hitung.get(w.slug)! > 1) w.slug = `${w.slug}-${slugify(w.provinsi)}`;
  cacheDaftar = { sumber: data, daftar: hasil };
  return hasil;
}

/** Salinan daftar supaya pemanggil yang mengurutkan/mengubah hasilnya tidak merusak data bersama. */
export async function daftarWilayah(): Promise<Wilayah[]> {
  return (await semuaWilayah()).map((w) => ({ ...w }));
}

export async function wilayahDariSlug(slug: string) {
  const w = (await semuaWilayah()).find((x) => x.slug === slug);
  return w ? { ...w } : null;
}

// ---------- Jadwal ----------

/** Jadwal sebulan (data/jadwal/<tahun-bulan>/<provinsi>/<kota>.json). Bulan yang belum lengkap tidak disimpan. */
function jadwalBulan(provinsi: string, kabkota: string, tahun: number, bulan: number): Promise<Record<string, JadwalHari>> {
  return arsip(berkasArsip.jadwal(provinsi, kabkota, tahun, bulan), {
    masa: MASA_BERLAKU.jadwal,
    ambil: () => unduhJadwalBulan(provinsi, kabkota, tahun, bulan),
    layak: (j) => jadwalLengkap(j, tahun, bulan),
  });
}

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

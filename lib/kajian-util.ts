// Logika kajian yang dipakai di server dan browser. Port dari
// lib/features/kajian/kajian_data.dart di aplikasi Nawaitu.
import { HARI, LABEL, fmtMenit, isoTanggal, jamDinding, menitDari, tambahHari, type JadwalHari, type Waktu } from './waktu';

export type Kajian = {
  id: string;
  slug: string; // untuk alamat halaman detail
  judul: string;
  subJudul: string | null;
  ustadz: string[];
  tanggal: string | null; // kajian sekali; null untuk kajian rutin
  tanggalPerkiraan: boolean;
  hari: number[]; // 0 = Ahad ... 6 = Sabtu, untuk kajian rutin
  rutin: string | null;
  jam: string | null; // "HH:mm" bila tertulis
  jamSelesai: string | null;
  acuan: string | null; // "Maghrib", "Subuh", ... bila jam mengikuti waktu shalat
  zona: 'WIB' | 'WITA' | 'WIT';
  tempat: string;
  alamat: string | null;
  peta: string | null;
  wilayah: string | null; // slug wilayah dari sumber data
  kabkota: string | null;
  provinsi: string | null;
  mode: 'offline' | 'online' | 'hybrid';
  streaming: string | null;
  peserta: string | null;
  sumber: { nama: string; url: string }[];
  jadwalSlug: string | null; // wilayah jadwal shalat (EQuran) untuk menghitung acuan
};

/** Jadwal shalat per wilayah untuk menghitung "Ba'da Maghrib (±18:05)". */
export type JadwalAcuan = Record<string, Record<string, JadwalHari>>;

export const TZ = { WIB: 7, WITA: 8, WIT: 9 } as const;

function waktuAcuan(acuan: string): Waktu | null {
  const a = acuan.toLowerCase();
  if (/subuh|fajr|shubuh/.test(a)) return 'subuh';
  if (/dzuhur|zuhur|dhuhur|zhuhur|dhuhr/.test(a)) return 'dzuhur';
  if (/ashar|asar/.test(a)) return 'ashar';
  if (/maghrib|magrib/.test(a)) return 'maghrib';
  if (/isya|isha/.test(a)) return 'isya';
  if (/dhuha|duha/.test(a)) return 'dhuha';
  return null;
}

/** Menit sejak tengah malam waktu mulai kajian pada [iso], atau null bila tidak diketahui. */
function mulaiPada(k: Kajian, iso: string, acuan: JadwalAcuan): number | null {
  if (k.jam) return menitDari(k.jam);
  if (k.acuan && k.jadwalSlug) {
    const w = waktuAcuan(k.acuan);
    const j = acuan[k.jadwalSlug]?.[iso];
    if (w && j) return menitDari(j[w]);
  }
  return null;
}

export type Jadwal = { iso: string; ms: number; menit: number | null };

/**
 * Waktu mulai terdekat yang belum lewat lebih dari 2 jam, atau null bila sudah
 * lewat. Kajian tanpa jam diketahui dianggap dimulai pukul 00:00.
 */
export function berikutnya(k: Kajian, sekarang: number, acuan: JadwalAcuan): Jadwal | null {
  const tz = TZ[k.zona];
  const batas = sekarang - 2 * 3600e3;
  const ms = (iso: string, menit: number | null) => Date.parse(iso + 'T00:00:00Z') + ((menit ?? 0) * 60 - tz * 3600) * 1e3;
  if (k.tanggal) {
    const m = mulaiPada(k, k.tanggal, acuan);
    const t = ms(k.tanggal, m);
    return t > batas ? { iso: k.tanggal, ms: t, menit: m } : null;
  }
  const hariIni = isoTanggal(jamDinding(tz, sekarang));
  for (let d = 0; d <= 7; d++) {
    const iso = tambahHari(hariIni, d);
    if (!k.hari.includes(new Date(iso + 'T00:00:00Z').getUTCDay())) continue;
    const m = mulaiPada(k, iso, acuan);
    const t = ms(iso, m);
    if (t > batas) return { iso, ms: t, menit: m };
  }
  return null;
}

/** "08:45 WIB", "Ba'da Maghrib (±18:05)", atau "Jam belum diketahui". */
export function keteranganJam(k: Kajian, j: Jadwal | null) {
  if (k.jam) return `${k.jam}${k.jamSelesai ? `–${k.jamSelesai}` : ''} ${k.zona}`;
  if (k.acuan) {
    const w = waktuAcuan(k.acuan);
    const awal = w === 'dhuha' ? 'Waktu' : "Ba'da";
    const nama = w ? LABEL[w] : k.acuan;
    return `${awal} ${nama}${j?.menit != null ? ` (±${fmtMenit(j.menit)} ${k.zona})` : ''}`;
  }
  return 'Jam belum diketahui';
}

/** "Hari ini", "Besok", atau nama hari dan tanggal. */
export function kapan(iso: string, sekarang: number, zona: Kajian['zona']) {
  const hariIni = isoTanggal(jamDinding(TZ[zona], sekarang));
  if (iso <= hariIni) return 'Hari ini';
  if (iso === tambahHari(hariIni, 1)) return 'Besok';
  const d = new Date(iso + 'T00:00:00Z');
  const sepekan = iso <= tambahHari(hariIni, 6);
  return sepekan ? HARI[d.getUTCDay()] : `${HARI[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export function jadwalTeks(k: Kajian) {
  if (k.rutin) return k.rutin.charAt(0).toUpperCase() + k.rutin.slice(1);
  if (k.tanggal) {
    const d = new Date(k.tanggal + 'T00:00:00Z');
    return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}${k.tanggalPerkiraan ? ' (perkiraan)' : ''}`;
  }
  return k.hari.length === 7 ? 'Setiap hari' : `Setiap ${[...k.hari].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((h) => HARI[h]).join(', ')}`;
}

export const labelMode = (m: Kajian['mode']) => (m === 'online' ? 'Online' : m === 'hybrid' ? 'Masjid + Live' : null);
export const labelPeserta = (p: string | null) => (p === 'akhwat' ? 'Akhwat' : p === 'ikhwan' ? 'Ikhwan' : null);

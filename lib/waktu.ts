// Fungsi waktu yang dipakai di server dan browser.

export const KUNCI_WAKTU = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;
export type Waktu = (typeof KUNCI_WAKTU)[number];
export type JadwalHari = Record<Waktu, string>; // "HH:mm" jam daerah

export const LABEL: Record<Waktu, string> = {
  imsak: 'Imsak', subuh: 'Subuh', terbit: 'Terbit', dhuha: 'Dhuha',
  dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya',
};
/** Waktu yang ditampilkan di kotak jadwal harian. */
export const TAMPIL: Waktu[] = ['subuh', 'terbit', 'dzuhur', 'ashar', 'maghrib', 'isya'];
export const WAJIB: Waktu[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

export const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const pad = (n: number) => String(n).padStart(2, '0');
export const menitDari = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fmtMenit = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.round(m) % 60)}`;

/** Jam dinding di zona [tz] (selisih jam dari UTC). Baca dengan getUTC*. */
export const jamDinding = (tz: number, ms = Date.now()) => new Date(ms + tz * 3600e3);
export const isoTanggal = (d: Date) => d.toISOString().slice(0, 10);
export const tambahHari = (iso: string, n: number) => isoTanggal(new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5));

export function tanggalPanjang(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function tanggalPendek(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${HARI[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()].slice(0, 3)}`;
}

export function tanggalHijriah(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(iso + 'T00:00:00Z'));
  } catch {
    return '';
  }
}

const HIJRIAH = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
function hijriah(iso: string) {
  const p = HIJRIAH.formatToParts(new Date(iso + 'T00:00:00Z'));
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { hari: n('day'), bulan: n('month'), tahun: n('year') };
}

/**
 * Ramadan yang sedang berjalan atau yang berikutnya (kalender Umm al-Qura, bisa beda satu hari dari
 * penetapan sidang isbat Kemenag). Mengembalikan tanggal awal dan akhir (ISO) serta tahun Hijriah.
 */
export function ramadanBerikutnya(dariIso: string) {
  let mulai: string | null = null;
  for (let i = -30; i <= 400; i++) {
    const iso = tambahHari(dariIso, i);
    const h = hijriah(iso);
    if (h.bulan === 9 && (h.hari === 1 || (i === -30 && h.hari > 1))) {
      mulai = h.hari === 1 ? iso : tambahHari(iso, 1 - h.hari);
      break;
    }
  }
  if (!mulai) return null;
  let selesai = mulai;
  while (hijriah(tambahHari(selesai, 1)).bulan === 9) selesai = tambahHari(selesai, 1);
  return { mulai, selesai, tahun: hijriah(mulai).tahun };
}

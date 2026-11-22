// "Kutipan hari ini": lima kutipan per hari dari dataset kutipan-json
// (https://github.com/asdamwongmantap/kutipan-json), satu dari tiap kelompok: Al-Qur'an, hadis, nasihat
// sahabat/ulama, hikmah (mahfudzat, peribahasa, buku, kata bijak), dan motivasi. Tiap kelompok maju satu
// butir per hari dan panjangnya berbeda-beda, jadi kombinasi harian jarang terulang.
// Menambah atau mengubah kutipan dilakukan di repo kutipan-json, lalu naikkan versinya di package.json.
import type { Kutipan as DataKutipan, KategoriKutipan, TemaKutipan } from 'kutipan-json';
import alquran from 'kutipan-json/data/alquran.json';
import hadis from 'kutipan-json/data/hadis.json';
import nasihatSahabat from 'kutipan-json/data/nasihat-sahabat.json';
import nasihatUlama from 'kutipan-json/data/nasihat-ulama.json';
import hikmah from 'kutipan-json/data/hikmah.json';
import peribahasa from 'kutipan-json/data/peribahasa.json';
import kutipanBuku from 'kutipan-json/data/kutipan-buku.json';
import kataBijak from 'kutipan-json/data/kata-bijak.json';
import motivasi from 'kutipan-json/data/motivasi.json';
import type { TemaAyat } from './poster-latar';
import type { Kutipan } from './kutipan-format';
import { isoTanggal, jamDinding } from './waktu';

export { sumberKutipan, type Kutipan } from './kutipan-format';

export const JUMLAH_HARIAN = 5; // satu dari tiap kelompok di bawah

const JENIS: Record<KategoriKutipan, string | undefined> = {
  alquran: "Al-Qur'an",
  hadis: 'Hadis',
  'nasihat-sahabat': 'Nasihat',
  'nasihat-ulama': 'Nasihat',
  hikmah: 'Hikmah',
  peribahasa: 'Peribahasa',
  'kutipan-buku': 'Buku',
  'kata-bijak': 'Kata Bijak',
  motivasi: undefined,
};

// Latar poster mengikuti tema kutipan.
const LATAR: Record<TemaKutipan, TemaAyat> = {
  belajar: 'taman', usaha: 'gunung', waktu: 'fajar', diri: 'cahaya', sesama: 'taman',
  sabar: 'hujan', syukur: 'fajar', ibadah: 'masjid', doa: 'malam',
};

const ubah = (k: DataKutipan): Kutipan => ({
  teks: k.teks,
  penutur: k.penutur ?? undefined,
  rujukan: k.rujukan ?? undefined,
  jenis: JENIS[k.kategori],
  tema: LATAR[k.tema],
});

/** Gabungkan beberapa daftar secara bergiliran supaya jenis sumbernya selang-seling dari hari ke hari. */
function selang(...daftar: unknown[][]): Kutipan[] {
  const isi = daftar.map((d) => (d as DataKutipan[]).map(ubah));
  const hasil: Kutipan[] = [];
  for (let i = 0; i < Math.max(...isi.map((d) => d.length)); i++) for (const d of isi) if (i < d.length) hasil.push(d[i]);
  return hasil;
}

// Urutan slide tiap hari: ayat, hadis, nasihat, hikmah, lalu motivasi.
const KELOMPOK = [
  selang(alquran),
  selang(hadis),
  selang(nasihatSahabat, nasihatUlama),
  selang(hikmah, peribahasa, kutipanBuku, kataBijak),
  selang(motivasi),
];

/** Lima kutipan untuk hari ini (WIB): satu per kelompok, masing-masing maju satu butir setiap hari. */
export function kutipanHariIni(ms = Date.now()): Kutipan[] {
  const hari = Math.floor(Date.parse(isoTanggal(jamDinding(7, ms)) + 'T00:00:00Z') / 864e5);
  return KELOMPOK.map((daftar, i) => daftar[(hari + i * 7) % daftar.length]);
}

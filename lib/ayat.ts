// "Ayat hari ini": daftar ayat pilihan. Teksnya dari API EQuran.id (bukan
// diketik ulang) supaya akurat. Satu surat utuh diunduh sekali lalu disimpan di
// data/quran/<nomor>.json; setelah itu cukup dibaca dari berkas.
import 'server-only';
import { MASA_BERLAKU, arsip } from './arsip';
import { berkasArsip, unduhSurat, type ArsipSurat } from './equran';
import { isoTanggal, jamDinding } from './waktu';

import type { TemaAyat } from './poster-latar';

/** [surat, ayat, tema gambar]. Dipilih yang terjemahannya cukup pendek untuk satu gambar; tema mengikuti makna ayat. */
const PILIHAN: [number, number, TemaAyat][] = [
  [2, 45, 'masjid'], // sabar dan shalat
  [2, 152, 'malam'], // ingat Allah
  [2, 153, 'gunung'], // sabar, Allah bersama orang sabar
  [2, 155, 'gunung'], // ujian dan sabar
  [2, 186, 'malam'], // Allah dekat, doa dikabulkan
  [2, 201, 'fajar'], // doa kebaikan dunia dan akhirat
  [3, 8, 'cahaya'], // petunjuk hati
  [3, 139, 'gunung'], // jangan lemah dan bersedih
  [7, 23, 'malam'], // doa memohon ampun
  [8, 46, 'gunung'], // taat dan sabar
  [10, 57, 'cahaya'], // pelajaran, petunjuk, rahmat
  [13, 28, 'malam'], // hati tenteram dengan mengingat Allah
  [14, 7, 'taman'], // syukur menambah nikmat
  [16, 128, 'taman'], // Allah bersama orang bertakwa dan berbuat baik
  [17, 24, 'taman'], // berbakti kepada orang tua
  [20, 114, 'cahaya'], // tambahan ilmu
  [21, 87, 'malam'], // doa Nabi Yunus dalam gelap
  [25, 74, 'taman'], // doa keluarga yang menyejukkan
  [29, 69, 'fajar'], // Allah menunjukkan jalan
  [33, 41, 'malam'], // banyak berdzikir
  [39, 53, 'hujan'], // jangan putus asa dari rahmat Allah
  [40, 60, 'malam'], // berdoalah, Aku kabulkan
  [47, 7, 'gunung'], // menolong agama Allah
  [49, 10, 'taman'], // persaudaraan orang beriman
  [50, 16, 'cahaya'], // Allah lebih dekat dari urat leher
  [51, 56, 'masjid'], // diciptakan untuk beribadah
  [55, 13, 'taman'], // nikmat Tuhan
  [59, 18, 'fajar'], // bertakwa dan menyiapkan hari esok
  [64, 16, 'fajar'], // bertakwa semampunya
  [65, 3, 'hujan'], // tawakal dan rezeki tak disangka
  [93, 5, 'fajar'], // karunia hingga engkau rida
  [94, 5, 'fajar'], // bersama kesulitan ada kemudahan
];

export type Ayat = { surat: number; ayat: number; namaSurat: string; arab: string; terjemah: string; tema: TemaAyat };

/** Satu surat utuh dari arsip (data/quran/<nomor>.json). */
export function surat(nomor: number): Promise<ArsipSurat> {
  return arsip(berkasArsip.surat(nomor), { masa: MASA_BERLAKU.surat, ambil: () => unduhSurat(nomor) });
}

/** Ayat untuk hari ini (WIB), bergilir sesuai urutan daftar. Null bila teksnya tidak dapat dimuat. */
export async function ayatHariIni(ms = Date.now()): Promise<Ayat | null> {
  const hari = Math.floor(Date.parse(isoTanggal(jamDinding(7, ms)) + 'T00:00:00Z') / 864e5);
  const [nomor, ayat, tema] = PILIHAN[hari % PILIHAN.length];
  try {
    const s = await surat(nomor);
    const a = s.ayat.find((x) => x.nomor === ayat);
    return a ? { surat: nomor, ayat, namaSurat: s.namaLatin, arab: a.arab, terjemah: a.terjemah, tema } : null;
  } catch {
    return null;
  }
}

export const rujukanAyat = (a: Ayat) => `QS. ${a.namaSurat} [${a.surat}]: ${a.ayat}`;

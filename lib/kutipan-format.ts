// Tipe dan format kutipan yang dipakai komponen client. Sengaja dipisah dari lib/kutipan.ts
// supaya datanya (ratusan kutipan) tidak ikut terbawa ke bundle browser.
import type { TemaAyat } from './poster-latar';

export type Kutipan = {
  teks: string;
  /** Siapa yang mengucapkan, mis. "Nabi Muhammad ﷺ". Kosong = tidak ada keterangan asal yang ditampilkan. */
  penutur?: string;
  /** Asal kutipan: surah dan ayat, perawi hadis, atau kitab. */
  rujukan?: string;
  /** Label kecil di atas sumber, mis. "Hadis". Kosong untuk kalimat motivasi. */
  jenis?: string;
  tema: TemaAyat;
};

/** "Penutur · rujukan" untuk poster dan teks bagikan; string kosong bila kutipan tidak punya asal. */
export const sumberKutipan = (k: Kutipan) => [k.penutur, k.rujukan].filter(Boolean).join(' · ');

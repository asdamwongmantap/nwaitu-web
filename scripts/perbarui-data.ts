// Ambil ulang data dari API EQuran.id sekarang juga dan tulis ke data/*.json,
// tanpa menunggu masa berlakunya habis. Biasanya tidak perlu: situs mengisi dan
// memperbarui arsip sendiri (lib/arsip.ts). Berguna untuk mengisi awal sebelum
// commit/deploy.
//
//   npm run data                 # wilayah + surat untuk ayat pilihan
//   npm run data -- wilayah      # hanya daftar kab/kota
//   npm run data -- ayat         # surat-surat di PILIHAN (lib/ayat.ts)
//   npm run data -- quran        # seluruh 114 surat (~5 MB)
//
// Butuh Node 22.18+ (menjalankan TypeScript langsung).
import { readFile } from 'node:fs/promises';
import { FOLDER_DATA, tulisArsip } from '../lib/arsip.ts';
import { berkasArsip, unduhSurat, unduhWilayah } from '../lib/equran.ts';

async function wilayah() {
  const d = await unduhWilayah();
  await tulisArsip(berkasArsip.wilayah(), d);
  const jumlah = Object.values(d.provinsi).reduce((n, k) => n + k.length, 0);
  console.log(`✓ ${berkasArsip.wilayah()}: ${Object.keys(d.provinsi).length} provinsi, ${jumlah} kab/kota`);
}

async function suratSuratan(nomor: number[]) {
  for (const n of nomor) {
    const s = await unduhSurat(n);
    await tulisArsip(berkasArsip.surat(n), s);
    console.log(`✓ ${berkasArsip.surat(n)}: ${s.namaLatin}, ${s.ayat.length} ayat`);
  }
}

async function ayat() {
  // Daftar ayat dibaca dari PILIHAN di lib/ayat.ts supaya hanya ada satu sumber.
  const ts = await readFile(new URL('../lib/ayat.ts', import.meta.url), 'utf8');
  const blok = ts.match(/const PILIHAN[^=]*=\s*\[([\s\S]*?)\n\];/)?.[1] ?? '';
  const nomor = [...new Set([...blok.matchAll(/\[\s*(\d+)\s*,\s*\d+\s*,/g)].map((m) => Number(m[1])))];
  if (!nomor.length) throw new Error('PILIHAN di lib/ayat.ts tidak terbaca');
  await suratSuratan(nomor);
}

const tugas: Record<string, () => Promise<void>> = {
  wilayah,
  ayat,
  quran: () => suratSuratan(Array.from({ length: 114 }, (_, i) => i + 1)),
};
const pilih = process.argv.slice(2);
const jalan = pilih.length ? pilih : ['wilayah', 'ayat'];
for (const n of jalan) {
  if (!tugas[n]) throw new Error(`Tidak dikenal: ${n}. Pilihan: ${Object.keys(tugas).join(', ')}`);
  await tugas[n]();
}
console.log(`Selesai. Berkas ada di ${FOLDER_DATA}`);

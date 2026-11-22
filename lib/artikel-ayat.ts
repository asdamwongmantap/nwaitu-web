// Kotak ayat di artikel. Penulis cukup menulis kode pendek di isi artikel (lib/situs.ts):
//   [[QS 49:12]]     satu ayat
//   [[QS 103:1-3]]   beberapa ayat berurutan
// Isi kotak: teks Arab, lalu terjemahan lengkap, lalu rujukan.
// Teks Arab dan terjemahan diambil dari arsip EQuran.id (Kemenag RI), tidak diketik ulang, supaya akurat.
import 'server-only';
import { surat } from './ayat';
import type { ArsipSurat } from './equran';

const KODE = /\[\[QS (\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\]\]/g;
const ANGKA_ARAB = '٠١٢٣٤٥٦٧٨٩';
const angkaArab = (n: number) => String(n).replace(/\d/g, (d) => ANGKA_ARAB[Number(d)]);
const aman = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Ganti semua kode [[QS …]] dengan kotak ayat. Bila suratnya gagal dimuat, kode dihapus (rujukan tetap ada di teks). */
export async function sisipkanAyat(html: string): Promise<string> {
  const semua = [...html.matchAll(KODE)];
  if (!semua.length) return html;
  const nomor = [...new Set(semua.map((m) => Number(m[1])))];
  const data = new Map<number, ArsipSurat | null>(await Promise.all(nomor.map(async (n) => [n, await surat(n).catch(() => null)] as const)));

  return html.replace(KODE, (_, s: string, a1: string, a2: string | undefined) => {
    const sr = data.get(Number(s));
    const awal = Number(a1);
    const akhir = a2 ? Number(a2) : awal;
    const ayat = sr?.ayat.filter((x) => x.nomor >= awal && x.nomor <= akhir) ?? [];
    if (!sr || ayat.length !== akhir - awal + 1) return '';
    const rujukan = `QS. ${sr.namaLatin}: ${awal}${akhir > awal ? `–${akhir}` : ''}`;
    const arab = ayat.map((x) => `${aman(x.arab)} ﴿${angkaArab(x.nomor)}﴾`).join(' ');
    // Beberapa ayat: tiap terjemahan diberi nomor ayatnya supaya mudah dicocokkan dengan teks Arab.
    const terjemah = ayat.map((x) => (ayat.length > 1 ? `(${x.nomor}) ${x.terjemah}` : x.terjemah)).join(' ');
    // Tanpa tanda kutip pembungkus: sebagian terjemahan Kemenag (mis. ayat doa) sudah memuat kutipnya sendiri.
    const arti = `<span class="ka-arti">${aman(terjemah)}</span>`;
    return (
      `<figure class="kutip-ayat">` +
      `<p class="arab" lang="ar" dir="rtl">${arab}</p>` +
      `<figcaption>${arti}<b>${rujukan}</b></figcaption>` +
      `</figure>`
    );
  });
}

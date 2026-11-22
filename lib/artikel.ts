// Bantuan tampilan artikel: daftar isi dari subjudul, dan format tanggal terbit.
import type { Bab } from '@/components/PemanduBaca';
import type { Artikel } from './situs';
import { BULAN } from './waktu';

const polos = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const slug = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'bagian';

/** Beri id pada setiap <h2> (untuk tautan daftar isi) dan kembalikan daftarnya. */
export function siapkanIsi(isi: string): { html: string; bab: Bab[] } {
  const bab: Bab[] = [];
  const dipakai = new Set<string>();
  const html = isi.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, dalam: string) => {
    const judul = polos(dalam);
    let id = slug(judul);
    for (let n = 2; dipakai.has(id); n++) id = `${slug(judul)}-${n}`;
    dipakai.add(id);
    bab.push({ id, judul });
    return `<h2 id="${id}">${dalam}</h2>`;
  });
  return { html, bab };
}

/** "22 November 2026" dari "2026-11-22"; null bila artikel tidak punya tanggal terbit. */
export function tanggalTerbit(a: Artikel): string | null {
  if (!a.terbit) return null;
  const [t, b, h] = a.terbit.split('-').map(Number);
  return `${h} ${BULAN[b - 1]} ${t}`;
}

/** Kategori untuk label; artikel lama tanpa kategori masuk "Panduan Ibadah". */
export const kategoriArtikel = (a: Artikel) => a.kategori ?? 'Panduan Ibadah';

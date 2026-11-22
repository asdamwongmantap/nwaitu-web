// Metadata SEO bersama. Next menggabungkan metadata antar-segmen secara dangkal: `openGraph` di halaman
// menimpa seluruh `openGraph` dari layout (gambar, siteName, locale ikut hilang). Karena itu semua halaman
// membangun metadatanya lewat `metaHalaman` supaya field dasar selalu ikut, lengkap dengan canonical dan og:url.
import type { Metadata } from 'next';
import { situs } from './situs';

export const OG_DASAR: NonNullable<Metadata['openGraph']> = {
  siteName: situs.nama,
  locale: 'id_ID',
  images: [{ url: '/img/og-image.png', width: 1024, height: 500, alt: `${situs.nama}: ${situs.tagline}` }],
};

type Opsi = {
  /** Judul halaman; template "… | Nawaitu" dari layout tetap berlaku kecuali memakai `{ absolute }`. */
  title: Metadata['title'];
  description: string;
  /** Alamat relatif dengan garis miring di akhir, mis. "/jadwal-sholat/kota-bandung/". */
  path: string;
  type?: 'website' | 'article';
};

export function metaHalaman({ title, description, path, type = 'website' }: Opsi): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DASAR, type, url: path, description },
    twitter: { card: 'summary_large_image', description },
  };
}

/** URL absolut; schema.org (mis. BreadcrumbList) mewajibkan alamat lengkap, bukan relatif. */
export const urlPenuh = (path: string) => `${situs.url}${path}`;

/** JSON-LD BreadcrumbList dari pasangan [nama, path]. */
export const remahLd = (remah: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: remah.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: urlPenuh(path) })),
});

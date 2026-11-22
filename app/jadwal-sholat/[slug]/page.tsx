import type { Metadata } from 'next';
import JadwalKota from '@/components/JadwalKota';
import { KOTA_POPULER, wilayahDariSlug } from '@/lib/jadwal';
import { metaHalaman } from '@/lib/seo';
import { BULAN, jamDinding } from '@/lib/waktu';

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return KOTA_POPULER.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await wilayahDariSlug((await params).slug).catch(() => null);
  if (!w) return { title: 'Kota tidak ditemukan', robots: { index: false } };
  const nama = w.namaTampil;
  // Bulan berjalan di judul menaikkan klik dari hasil pencarian; halaman dibuat ulang tiap hari (revalidate).
  const kini = jamDinding(w.tz);
  const bulan = `${BULAN[kini.getUTCMonth()]} ${kini.getUTCFullYear()}`;
  // "sholat" dipakai di judul karena ejaan itu yang paling banyak dicari (sama seperti URL /jadwal-sholat/).
  return metaHalaman({
    title: `Jadwal Sholat ${nama} Hari Ini, ${bulan}`,
    description: `Jadwal sholat ${nama}, ${w.provinsi} hari ini dan sebulan penuh (${bulan}): Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya (${w.zona}). Resmi Kemenag RI.`,
    path: `/jadwal-sholat/${w.slug}/`,
  });
}

export default async function HalamanKota({ params }: Props) {
  return <JadwalKota slug={(await params).slug} />;
}

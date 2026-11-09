import type { Metadata } from 'next';
import JadwalKota from '@/components/JadwalKota';
import { KOTA_POPULER, wilayahDariSlug } from '@/lib/jadwal';

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
  return {
    title: `Jadwal Shalat ${nama} Hari Ini`,
    description: `Jadwal shalat (sholat) ${nama}, ${w.provinsi} hari ini dan sebulan penuh: Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya (${w.zona}). Jadwal resmi Kemenag RI.`,
    alternates: { canonical: `/jadwal-sholat/${w.slug}/` },
  };
}

export default async function HalamanKota({ params }: Props) {
  return <JadwalKota slug={(await params).slug} />;
}

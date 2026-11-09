import type { Metadata } from 'next';
import JadwalKota from '@/components/JadwalKota';
import { SLUG_BAWAAN } from '@/lib/jadwal';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Jadwal Shalat Seluruh Indonesia',
  description:
    'Jadwal shalat (sholat) resmi Kemenag RI untuk seluruh kabupaten/kota di Indonesia: Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya, lengkap sebulan. Tampil untuk Jakarta, pilih kota lain lewat menu.',
  alternates: { canonical: '/jadwal-sholat/' },
};

export default function HalamanJadwal() {
  return <JadwalKota slug={SLUG_BAWAAN} indeks />;
}

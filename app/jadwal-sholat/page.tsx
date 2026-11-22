import JadwalKota from '@/components/JadwalKota';
import { SLUG_BAWAAN } from '@/lib/jadwal';
import { metaHalaman } from '@/lib/seo';

export const revalidate = 86400;

export const metadata = metaHalaman({
  title: 'Jadwal Sholat Hari Ini Seluruh Indonesia',
  description:
    'Jadwal sholat resmi Kemenag RI untuk 500+ kabupaten/kota di Indonesia: Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya, lengkap sebulan. Pilih kota Anda.',
  path: '/jadwal-sholat/',
});

export default function HalamanJadwal() {
  return <JadwalKota slug={SLUG_BAWAAN} indeks />;
}

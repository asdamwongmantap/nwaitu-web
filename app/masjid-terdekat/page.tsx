import type { Metadata } from 'next';
import CariSekitar from '@/components/CariSekitar';
import Cta from '@/components/Cta';
import { IkonTempat } from '@/components/Ikon';
import KepalaHalaman from '@/components/KepalaHalaman';

export const metadata: Metadata = {
  title: 'Masjid dan Sekolah Islam Terdekat',
  description:
    'Cari masjid, mushalla, sekolah Islam, madrasah, dan pondok pesantren terdekat dari lokasi Anda, lengkap dengan jarak dan petunjuk rute.',
  alternates: { canonical: '/masjid-terdekat/' },
};

export default function HalamanSekitar() {
  return (
    <>
      <KepalaHalaman
        label="Terdekat"
        judul="Masjid dan Sekolah Islam Terdekat"
        ikon={<IkonTempat />}
        deskripsi="Temukan masjid, mushalla, sekolah Islam, madrasah, dan pondok pesantren di sekitar Anda, lengkap dengan jarak dan rute."
        info={['Jarak dan rute', 'Lokasi tidak disimpan', 'Data OpenStreetMap']}
      />
      <main className="wrap">
        <CariSekitar />
        <Cta />
      </main>
    </>
  );
}

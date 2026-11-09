import type { Metadata } from 'next';
import Cta from '@/components/Cta';
import DaftarWilayah from '@/components/DaftarWilayah';
import { daftarWilayah } from '@/lib/jadwal';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Jadwal Shalat Seluruh Indonesia',
  description:
    'Jadwal shalat (sholat) resmi Kemenag RI untuk seluruh kabupaten/kota di Indonesia: Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya, lengkap sebulan.',
  alternates: { canonical: '/jadwal-sholat/' },
};

export default async function HalamanJadwal() {
  const semua = await daftarWilayah().catch(() => []);
  const perProvinsi = new Map<string, { slug: string; namaTampil: string }[]>();
  for (const w of semua) {
    if (!perProvinsi.has(w.provinsi)) perProvinsi.set(w.provinsi, []);
    perProvinsi.get(w.provinsi)!.push({ slug: w.slug, namaTampil: w.namaTampil });
  }
  const data = [...perProvinsi].map(([provinsi, kota]) => ({ provinsi, kota }));
  return (
    <main className="wrap">
      <h1>Jadwal Shalat Seluruh Indonesia</h1>
      <p className="muted baca">
        Jadwal resmi Kementerian Agama RI untuk {semua.length || '500+'} kabupaten/kota. Cari kota Anda atau gunakan lokasi
        perangkat.
      </p>
      {data.length ? (
        <DaftarWilayah data={data} />
      ) : (
        <div className="kosong">
          <b>Daftar kota belum bisa dimuat</b>Server jadwal sedang tidak dapat dihubungi. Coba lagi nanti.
        </div>
      )}
      <Cta />
    </main>
  );
}

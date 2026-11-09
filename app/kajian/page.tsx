import type { Metadata } from 'next';
import Cta from '@/components/Cta';
import DaftarKajian from '@/components/DaftarKajian';
import { REPO_KAJIAN, muatKajian } from '@/lib/kajian';

export const revalidate = 21600;

export const metadata: Metadata = {
  title: 'Jadwal Kajian Islam Terdekat',
  description:
    'Jadwal kajian islami terbaru di berbagai kota di Indonesia: pemateri, waktu, lokasi, kajian rutin dan online. Diperbarui otomatis setiap hari.',
  alternates: { canonical: '/kajian/' },
};

const fmtData = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) + ' WIB';

export default async function HalamanKajian() {
  const data = await muatKajian().catch(() => null);
  return (
    <main className="wrap">
      <h1>Jadwal Kajian</h1>
      <p className="muted baca">
        Kajian islami di berbagai kota, termasuk kajian rutin pekanan dan kajian online. Jam yang mengikuti waktu shalat
        (mis. ba&apos;da Maghrib) diperkirakan dari jadwal shalat wilayah tersebut.
        {data?.dibuat && <> Data per {fmtData(data.dibuat)}.</>}
      </p>
      {data ? (
        <DaftarKajian data={data} dibuatHalaman={Date.now()} />
      ) : (
        <div className="kosong">
          <b>Jadwal kajian belum bisa dimuat</b>Silakan coba lagi nanti.
        </div>
      )}
      <div className="catatan">
        Jadwal dibaca otomatis dari pengumuman publik (kanal Telegram dan situs masjid) sehingga bisa keliru atau berubah.
        Selalu cek tautan sumber sebelum berangkat. Hak atas isi pengumuman milik penyelenggara masing-masing.{' '}
        <a href={REPO_KAJIAN} rel="noopener">
          Tentang data ini
        </a>
        .
      </div>
      <Cta />
    </main>
  );
}

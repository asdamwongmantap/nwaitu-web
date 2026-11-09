import type { Metadata } from 'next';
import Cta from '@/components/Cta';
import DaftarKajian from '@/components/DaftarKajian';
import { IkonKajian } from '@/components/Ikon';
import KepalaHalaman from '@/components/KepalaHalaman';
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
    <>
      <KepalaHalaman
        label="Kajian"
        judul="Jadwal Kajian"
        ikon={<IkonKajian />}
        deskripsi={
          <>
            Kajian islami di berbagai kota, termasuk kajian rutin pekanan dan kajian online. Jam yang mengikuti waktu shalat
            (mis. ba&apos;da Maghrib) diperkirakan dari jadwal shalat wilayah tersebut.
          </>
        }
        info={data ? [`${data.wilayah.length} wilayah`, 'Rutin dan online', ...(data.dibuat ? [`Data per ${fmtData(data.dibuat)}`] : [])] : ['Rutin dan online']}
      />
      <main className="wrap">
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
    </>
  );
}

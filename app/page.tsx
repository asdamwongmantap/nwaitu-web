import Link from 'next/link';
import Cta from '@/components/Cta';
import DaftarKajian from '@/components/DaftarKajian';
import { IkonArtikel, IkonJadwal, IkonKajian, IkonTempat } from '@/components/Ikon';
import KutipanSlider from '@/components/KutipanSlider';
import TombolPoster from '@/components/TombolPoster';
import Ubin from '@/components/Ubin';
import WidgetShalat, { type DataJadwal } from '@/components/WidgetShalat';
import { ayatHariIni, rujukanAyat } from '@/lib/ayat';
import { kutipanHariIni } from '@/lib/kutipan';
import { SLUG_BAWAAN, jadwalWilayah, wilayahDariSlug } from '@/lib/jadwal';
import { muatKajian, type DataKajian } from '@/lib/kajian';
import { artikel, situs } from '@/lib/situs';
import { isoTanggal, jamDinding } from '@/lib/waktu';

export const revalidate = 21600;

async function jadwalBawaan(): Promise<DataJadwal | null> {
  try {
    const wilayah = await wilayahDariSlug(SLUG_BAWAAN);
    return wilayah ? { wilayah, jadwal: await jadwalWilayah(wilayah, 2) } : null;
  } catch {
    return null;
  }
}

export default async function Beranda() {
  const [jadwal, kajian, ayat] = await Promise.all([jadwalBawaan(), muatKajian().catch((): DataKajian | null => null), ayatHariIni()]);
  const dibuat = Date.now();
  const kutipan = kutipanHariIni(dibuat);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: situs.nama, url: situs.url, inLanguage: 'id', description: situs.deskripsi },
    { '@context': 'https://schema.org', '@type': 'Organization', name: situs.nama, url: situs.url, logo: `${situs.url}/img/icon-512.png`, slogan: situs.tagline },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <WidgetShalat
        awal={jadwal}
        hariIniAwal={isoTanggal(jamDinding(7, dibuat))}
        tumpuk
        judul={
          <>
            <h1 className="brand">{situs.nama}</h1>
            <p className="tagline">{situs.tagline}</p>
          </>
        }
      />
      <main className="wrap">
        <div className="ayat-bagian">
          {ayat && (
            <section className="ayat-kolom" aria-labelledby="judul-ayat">
              <div className="kartu-ayat">
              <div className="ayat-kepala">
                <h2 id="judul-ayat">Ayat hari ini</h2>
                <TombolPoster
                  label="Bagikan ayat"
                  isi={{ jenis: 'ayat', arab: ayat.arab, terjemah: ayat.terjemah, rujukan: rujukanAyat(ayat), tema: ayat.tema, path: '/' }}
                />
              </div>
              <figure>
                <p className="arab" lang="ar" dir="rtl">
                  {ayat.arab}
                </p>
                <div className="hias" aria-hidden="true" />
                <blockquote>“{ayat.terjemah}”</blockquote>
                <figcaption>
                  <b>{rujukanAyat(ayat)}</b>
                  Teks dan terjemahan: Kemenag RI via EQuran.id
                </figcaption>
              </figure>
              </div>
            </section>
          )}
          <KutipanSlider data={kutipan} />
        </div>

        <section className="jelajah" aria-label="Menu utama">
          <Ubin href="/jadwal-sholat/" ikon={<IkonJadwal />} judul="Jadwal Shalat" ket="500+ kota dan kabupaten, lengkap sebulan penuh." />
          <Ubin href="/masjid-terdekat/" ikon={<IkonTempat />} judul="Masjid & Sekolah" ket="Masjid, madrasah, dan pesantren terdekat." />
          <Ubin href="/kajian/" ikon={<IkonKajian />} judul="Kajian" ket="Pemateri, waktu, lokasi, dan tautan sumber." />
          <Ubin href="/artikel/" ikon={<IkonArtikel />} judul="Artikel" ket="Niat, tata cara, dan doa sehari-hari." />
        </section>

        <div className="kepala-bagian bagian">
          <h2>Kajian terdekat</h2>
          <Link href="/kajian/">Lihat semua kajian →</Link>
        </div>
        {kajian ? (
          <DaftarKajian data={kajian} dibuatHalaman={dibuat} batas={6} ringkas />
        ) : (
          <div className="kosong">
            <b>Jadwal kajian belum bisa dimuat</b>Silakan coba lagi nanti.
          </div>
        )}

        <div className="kepala-bagian bagian">
          <h2>Artikel</h2>
          <Link href="/artikel/">Semua artikel →</Link>
        </div>
        <div className="grid">
          {artikel.map((a) => (
            <Link key={a.slug} className="card kartu-artikel" href={`/artikel/${a.slug}/`}>
              <span className="ubin-ikon kecil">
                <IkonArtikel />
              </span>
              <h3>{a.judul}</h3>
              <div className="muted">{a.ringkas}</div>
              <span className="baca-lanjut">Baca artikel →</span>
            </Link>
          ))}
        </div>
        <Cta />
      </main>
    </>
  );
}

import Link from 'next/link';
import Cta from '@/components/Cta';
import DaftarKajian from '@/components/DaftarKajian';
import WidgetShalat, { type DataJadwal } from '@/components/WidgetShalat';
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
  const [jadwal, kajian] = await Promise.all([jadwalBawaan(), muatKajian().catch((): DataKajian | null => null)]);
  const dibuat = Date.now();
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
        judul={
          <>
            <h1 className="brand">{situs.nama}</h1>
            <p className="tagline">{situs.tagline}</p>
          </>
        }
      />
      <main className="wrap">
        <div className="menu-cepat">
          <Link href="/jadwal-sholat/">
            <b>Jadwal Shalat</b>
            <span>Jadwal resmi Kemenag untuk 500+ kabupaten/kota, lengkap sebulan penuh.</span>
          </Link>
          <Link href="/kajian/">
            <b>Kajian</b>
            <span>Kajian islami terdekat: pemateri, waktu, lokasi, dan tautan sumber.</span>
          </Link>
          <Link href="/artikel/">
            <b>Artikel</b>
            <span>Niat, tata cara, dan doa ibadah sehari-hari secara ringkas.</span>
          </Link>
        </div>

        <div className="kepala-bagian">
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

        <div className="kepala-bagian">
          <h2>Artikel</h2>
          <Link href="/artikel/">Semua artikel →</Link>
        </div>
        <div className="grid">
          {artikel.map((a) => (
            <Link key={a.slug} className="card" href={`/artikel/${a.slug}/`}>
              <h3>{a.judul}</h3>
              <div className="muted">{a.ringkas}</div>
            </Link>
          ))}
        </div>
        <Cta />
      </main>
    </>
  );
}

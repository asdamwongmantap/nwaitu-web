import type { Metadata } from 'next';
import Link from 'next/link';
import Cta from '@/components/Cta';
import { IkonArtikel, IkonJadwal } from '@/components/Ikon';
import KepalaHalaman from '@/components/KepalaHalaman';
import { artikel, menitBaca, situs } from '@/lib/situs';

export const metadata: Metadata = {
  title: 'Artikel',
  description: `Artikel ringkas seputar ibadah sehari-hari: niat, tata cara, dan doa. Teman ibadah harian Anda di ${situs.nama}.`,
  alternates: { canonical: '/artikel/' },
};

export default function HalamanArtikel() {
  return (
    <>
      <KepalaHalaman
        label="Panduan ibadah"
        judul="Artikel"
        ikon={<IkonArtikel />}
        deskripsi="Artikel ringkas seputar ibadah sehari-hari: niat, tata cara, dan doa."
        info={[`${artikel.length} artikel`, 'Bisa dibaca offline']}
        tanpaAlat
      />
      <main className="wrap">
        <div className="grid grid-artikel">
          {artikel.map((a) => (
            <Link key={a.slug} className="card kartu-artikel besar" href={`/artikel/${a.slug}/`}>
              <span className="ubin-ikon">
                <IkonArtikel />
              </span>
              <h2>{a.judul}</h2>
              <p className="muted">{a.ringkas}</p>
              <span className="artikel-kaki">
                <span className="waktu-baca">
                  <IkonJadwal />
                  {menitBaca(a)} menit baca
                </span>
                <span className="baca-lanjut">Baca artikel →</span>
              </span>
            </Link>
          ))}
        </div>
        <Cta />
      </main>
    </>
  );
}

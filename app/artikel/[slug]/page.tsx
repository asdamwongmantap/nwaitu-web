import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BagikanArtikel from '@/components/BagikanArtikel';
import Cta from '@/components/Cta';
import TombolPoster from '@/components/TombolPoster';
import { IkonJadwal } from '@/components/Ikon';
import { DaftarIsi, ProgresBaca } from '@/components/PemanduBaca';
import { kategoriArtikel, siapkanIsi, tanggalTerbit } from '@/lib/artikel';
import { sisipkanAyat } from '@/lib/artikel-ayat';
import { metaHalaman, remahLd } from '@/lib/seo';
import { artikel, menitBaca, situs } from '@/lib/situs';

export const dynamicParams = false;
export function generateStaticParams() {
  return artikel.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = artikel.find((x) => x.slug === slug);
  if (!a) return {};
  return metaHalaman({ title: a.judul, description: a.ringkas, path: `/artikel/${a.slug}/`, type: 'article' });
}

export default async function DetailArtikel({ params }: Props) {
  const { slug } = await params;
  const a = artikel.find((x) => x.slug === slug);
  if (!a) notFound();
  const path = `/artikel/${a.slug}/`;
  const kategori = kategoriArtikel(a);
  const tanggal = tanggalTerbit(a);
  // Isi artikel ditulis sendiri di lib/situs.ts (bukan dari pengunjung). Kode [[QS …]] diganti teks ayat
  // resmi (EQuran.id/Kemenag), lalu subjudulnya diberi id untuk daftar isi.
  const { html, bab } = siapkanIsi(await sisipkanAyat(a.isi));
  const adaDaftarIsi = bab.length >= 3;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.judul,
      description: a.ringkas,
      inLanguage: 'id',
      articleSection: kategori,
      ...(a.terbit && { datePublished: a.terbit, dateModified: a.terbit }),
      author: { '@type': 'Organization', name: `Tim ${situs.nama}`, url: situs.url },
      mainEntityOfPage: `${situs.url}${path}`,
      image: `${situs.url}/img/og-image.png`,
      publisher: { '@type': 'Organization', name: situs.nama, logo: { '@type': 'ImageObject', url: `${situs.url}/img/icon-512.png` } },
    },
    remahLd([['Beranda', '/'], ['Artikel', '/artikel/'], [a.judul, path]]),
  ];

  const isiPoster = { jenis: 'artikel', judul: a.judul, ringkas: a.ringkas, kategori, menit: menitBaca(a), path } as const;

  // Baca juga: utamakan kategori yang sama, lalu artikel terbaru lainnya.
  const lain = artikel.filter((x) => x.slug !== a.slug);
  const terkait = [...lain.filter((x) => kategoriArtikel(x) === kategori), ...lain.filter((x) => kategoriArtikel(x) !== kategori)].slice(0, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <ProgresBaca target="isi-artikel" />

      <section className="kepala-halaman kepala-artikel">
        <div className="wrap">
          <nav className="remah" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            <Link href="/artikel/">Artikel</Link>
          </nav>
          <span className="ka-kategori">{kategori}</span>
          <h1>{a.judul}</h1>
          <p className="kh-deskripsi">{a.ringkas}</p>
          <div className="ka-meta">
            <div className="ka-penulis">
              <span className="ka-avatar" aria-hidden="true">
                <img src="/img/logo.png" alt="" width={18} height={23} />
              </span>
              <span>
                <b>Tim {situs.nama}</b>
                <span className="ka-detail">
                  {tanggal && <time dateTime={a.terbit}>{tanggal}</time>}
                  {tanggal && <span aria-hidden="true"> · </span>}
                  {menitBaca(a)} menit baca
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="wrap">
        <div className={adaDaftarIsi ? 'tata-baca' : 'tata-baca tanpa-samping'}>
          <article className="kartu-baca">
            {adaDaftarIsi && <DaftarIsi bab={bab} varian="lipat" />}
            <div id="isi-artikel" className="isi-artikel" dangerouslySetInnerHTML={{ __html: html }} />
            <p className="catatan-artikel">
              Disusun oleh Tim {situs.nama} dari Al-Qur&apos;an dan hadis. Untuk pertanyaan fikih yang lebih rinci, tanyakan kepada ustadz
              setempat.
            </p>
            <section className="kartu-bagikan" aria-labelledby="judul-bagikan">
              <div>
                <h2 id="judul-bagikan">Bermanfaat? Bagikan artikel ini</h2>
                <p>Menunjukkan jalan kebaikan berpahala seperti orang yang mengerjakannya (HR. Muslim).</p>
              </div>
              <BagikanArtikel varian="lengkap" judul={a.judul} ringkas={a.ringkas} path={path} />
              <div className="bagikan-lengkap">
                <TombolPoster className="bg-gambar" label="Buat gambar / story IG" isi={isiPoster} />
              </div>
            </section>
          </article>

          {adaDaftarIsi && (
            <aside className="samping-baca">
              <div className="samping-lekat">
                <DaftarIsi bab={bab} varian="samping" />
                <div className="samping-bagikan">
                  <p className="di-judul">Bagikan</p>
                  <BagikanArtikel varian="ikon" judul={a.judul} ringkas={a.ringkas} path={path} />
                </div>
              </div>
            </aside>
          )}
        </div>

        {terkait.length > 0 && (
          <>
            <div className="kepala-bagian bagian">
              <h2>Baca juga</h2>
              <Link href="/artikel/">Semua artikel →</Link>
            </div>
            <div className="grid grid-terkait">
              {terkait.map((x) => (
                <Link key={x.slug} className="card kartu-artikel" href={`/artikel/${x.slug}/`}>
                  <span className="ka-tag">{kategoriArtikel(x)}</span>
                  <h3>{x.judul}</h3>
                  <div className="muted">{x.ringkas}</div>
                  <span className="artikel-kaki">
                    <span className="waktu-baca">
                      <IkonJadwal />
                      {menitBaca(x)} menit baca
                    </span>
                    <span className="baca-lanjut">Baca →</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
        <Cta />
      </main>
    </>
  );
}

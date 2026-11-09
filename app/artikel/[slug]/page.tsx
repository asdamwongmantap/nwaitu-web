import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Cta from '@/components/Cta';
import { IkonArtikel } from '@/components/Ikon';
import KepalaHalaman from '@/components/KepalaHalaman';
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
  return {
    title: a.judul,
    description: a.ringkas,
    alternates: { canonical: `/artikel/${a.slug}/` },
    openGraph: { type: 'article' },
  };
}

export default async function DetailArtikel({ params }: Props) {
  const { slug } = await params;
  const a = artikel.find((x) => x.slug === slug);
  if (!a) notFound();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.judul,
    description: a.ringkas,
    inLanguage: 'id',
    mainEntityOfPage: `${situs.url}/artikel/${a.slug}/`,
    image: `${situs.url}/img/og-image.png`,
    publisher: { '@type': 'Organization', name: situs.nama, logo: { '@type': 'ImageObject', url: `${situs.url}/img/icon-512.png` } },
  };
  const lainnya = artikel.filter((x) => x.slug !== a.slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <KepalaHalaman
        kembali={{ href: '/artikel/', label: 'Semua artikel' }}
        label="Panduan ibadah"
        ikon={<IkonArtikel />}
        judul={a.judul}
        deskripsi={a.ringkas}
        info={[`${menitBaca(a)} menit baca`]}
      />
      <main className="wrap">
        <article className="kartu-baca">
          {/* Isi artikel ditulis sendiri di lib/situs.ts, bukan dari pengunjung. */}
          <div className="isi-artikel" dangerouslySetInnerHTML={{ __html: a.isi }} />
        </article>

        {lainnya.length > 0 && (
          <>
            <div className="kepala-bagian bagian">
              <h2>Artikel lainnya</h2>
              <Link href="/artikel/">Semua artikel →</Link>
            </div>
            <div className="grid">
              {lainnya.map((x) => (
                <Link key={x.slug} className="card kartu-artikel" href={`/artikel/${x.slug}/`}>
                  <span className="ubin-ikon kecil">
                    <IkonArtikel />
                  </span>
                  <h3>{x.judul}</h3>
                  <div className="muted">{x.ringkas}</div>
                  <span className="baca-lanjut">Baca artikel →</span>
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

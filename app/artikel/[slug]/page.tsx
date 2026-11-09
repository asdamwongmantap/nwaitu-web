import type { Metadata } from 'next';
import { Amiri } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Cta from '@/components/Cta';
import { artikel, situs } from '@/lib/situs';

const amiri = Amiri({ subsets: ['arabic'], weight: '400', variable: '--font-amiri', display: 'swap' });

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
  return (
    <main className={`wrap baca ${amiri.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <p style={{ marginTop: 24 }}>
        <Link href="/artikel/">← Semua artikel</Link>
      </p>
      <h1>{a.judul}</h1>
      {/* Isi artikel ditulis sendiri di lib/situs.ts, bukan dari pengunjung. */}
      <div dangerouslySetInnerHTML={{ __html: a.isi }} />
      <Cta />
    </main>
  );
}

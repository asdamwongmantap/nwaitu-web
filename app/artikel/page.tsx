import type { Metadata } from 'next';
import Link from 'next/link';
import Cta from '@/components/Cta';
import { artikel, situs } from '@/lib/situs';

export const metadata: Metadata = {
  title: 'Artikel',
  description: `Artikel ringkas seputar ibadah sehari-hari: niat, tata cara, dan doa. Teman ibadah harian Anda di ${situs.nama}.`,
  alternates: { canonical: '/artikel/' },
};

export default function HalamanArtikel() {
  return (
    <main className="wrap">
      <h1>Artikel</h1>
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
  );
}

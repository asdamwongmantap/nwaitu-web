import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Cta from '@/components/Cta';
import TabelBulan from '@/components/TabelBulan';
import WidgetShalat from '@/components/WidgetShalat';
import { KOTA_POPULER, daftarWilayah, jadwalWilayah, wilayahDariSlug } from '@/lib/jadwal';
import { BULAN, isoTanggal, jamDinding } from '@/lib/waktu';

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return KOTA_POPULER.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await wilayahDariSlug((await params).slug).catch(() => null);
  if (!w) return { title: 'Kota tidak ditemukan', robots: { index: false } };
  const nama = w.namaTampil;
  return {
    title: `Jadwal Shalat ${nama} Hari Ini`,
    description: `Jadwal shalat (sholat) ${nama}, ${w.provinsi} hari ini dan sebulan penuh: Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya (${w.zona}). Jadwal resmi Kemenag RI.`,
    alternates: { canonical: `/jadwal-sholat/${w.slug}/` },
  };
}

export default async function HalamanKota({ params }: Props) {
  const { slug } = await params;
  const w = await wilayahDariSlug(slug);
  if (!w) notFound();
  const jadwal = await jadwalWilayah(w, 2);
  const hariIni = isoTanggal(jamDinding(w.tz));
  const bulanIni = hariIni.slice(0, 7);
  const baris = Object.entries(jadwal)
    .filter(([iso]) => iso.startsWith(bulanIni))
    .sort(([a], [b]) => a.localeCompare(b));
  const [th, bl] = bulanIni.split('-').map(Number);
  const tetangga = (await daftarWilayah()).filter((x) => x.provinsi === w.provinsi && x.slug !== w.slug);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ['Beranda', '/'],
      ['Jadwal Shalat', '/jadwal-sholat/'],
      [w.namaTampil, `/jadwal-sholat/${w.slug}/`],
    ].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <WidgetShalat
        awal={{ wilayah: w, jadwal }}
        hariIniAwal={hariIni}
        tetap
        judul={<h1 className="judul-kota">Jadwal Shalat {w.namaTampil}</h1>}
      />
      <main className="wrap">
        <h2>
          Jadwal {BULAN[bl - 1]} {th} <span className="muted">· {w.namaTampil}, {w.provinsi}</span>
        </h2>
        <TabelBulan baris={baris} tz={w.tz} />
        <div className="catatan">
          <b>Sumber:</b> jadwal resmi Kementerian Agama RI (Bimas Islam) melalui API EQuran.id, dalam waktu {w.zona}. Waktu
          di masjid setempat bisa berbeda beberapa menit; ikuti jadwal masjid Anda.
        </div>
        {tetangga.length > 0 && (
          <>
            <h2>Kota lain di {w.provinsi}</h2>
            <div className="chips">
              {tetangga.map((x) => (
                <Link key={x.slug} className="chip" href={`/jadwal-sholat/${x.slug}/`}>
                  {x.namaTampil}
                </Link>
              ))}
            </div>
          </>
        )}
        <p className="lanjut">
          <Link href="/jadwal-sholat/">Semua kabupaten/kota →</Link>
        </p>
        <Cta />
      </main>
    </>
  );
}

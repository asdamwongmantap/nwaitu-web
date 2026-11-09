import Link from 'next/link';
import { notFound } from 'next/navigation';
import Cta from '@/components/Cta';
import DaftarWilayah from '@/components/DaftarWilayah';
import PilihKota from '@/components/PilihKota';
import JadwalBulanan from '@/components/JadwalBulanan';
import WidgetShalat from '@/components/WidgetShalat';
import { KOTA_POPULER, daftarWilayah, jadwalWilayah, wilayahDariSlug } from '@/lib/jadwal';
import { isoTanggal, jamDinding } from '@/lib/waktu';

// Isi halaman jadwal satu kota. Dipakai oleh /jadwal-sholat/ (kota bawaan: Jakarta, dengan menu
// pilih kota) dan /jadwal-sholat/[slug]/.
export default async function JadwalKota({ slug, indeks = false }: { slug: string; indeks?: boolean }) {
  const w = await wilayahDariSlug(slug);
  if (!w) notFound();
  const [jadwal, semua] = await Promise.all([jadwalWilayah(w, 2), daftarWilayah().catch(() => [])]);
  const hariIni = isoTanggal(jamDinding(w.tz));

  const perProvinsi = new Map<string, { slug: string; namaTampil: string }[]>();
  for (const x of semua) {
    if (!perProvinsi.has(x.provinsi)) perProvinsi.set(x.provinsi, []);
    perProvinsi.get(x.provinsi)!.push({ slug: x.slug, namaTampil: x.namaTampil });
  }
  const data = [...perProvinsi].map(([provinsi, kota]) => ({ provinsi, kota }));
  const populer = KOTA_POPULER.flatMap((slug) => {
    const x = semua.find((k) => k.slug === slug);
    return x ? [{ slug: x.slug, namaTampil: x.namaTampil }] : [];
  });
  const tetangga = semua.filter((x) => x.provinsi === w.provinsi && x.slug !== w.slug);

  const remah = indeks
    ? [['Beranda', '/'], ['Jadwal Shalat', '/jadwal-sholat/']]
    : [['Beranda', '/'], ['Jadwal Shalat', '/jadwal-sholat/'], [w.namaTampil, `/jadwal-sholat/${w.slug}/`]];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: remah.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <WidgetShalat
        awal={{ wilayah: w, jadwal }}
        hariIniAwal={hariIni}
        tetap
        tumpuk
        judul={
          indeks ? (
            <>
              <h1 className="judul-kota">Jadwal Shalat Indonesia</h1>
              <p className="tagline">Menampilkan {w.namaTampil}. Pilih kota lain lewat menu di bawah.</p>
            </>
          ) : (
            <h1 className="judul-kota">Jadwal Shalat {w.namaTampil}</h1>
          )
        }
      />
      <main className="wrap">
        <PilihKota data={data} aktif={w.slug} populer={populer} />
        <JadwalBulanan slug={w.slug} nama={w.namaTampil} provinsi={w.provinsi} zona={w.zona} tz={w.tz} hariIni={hariIni} awal={jadwal} />
        <div className="catatan">
          <b>Sumber:</b> jadwal resmi Kementerian Agama RI (Bimas Islam) melalui API EQuran.id, dalam waktu {w.zona}. Waktu
          di masjid setempat bisa berbeda beberapa menit; ikuti jadwal masjid Anda.
        </div>
        {!indeks && tetangga.length > 0 && (
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
        {data.length > 0 && (
          <details className="semua-kota">
            <summary>Semua kabupaten/kota ({semua.length})</summary>
            <DaftarWilayah data={data} />
          </details>
        )}
        <Cta />
      </main>
    </>
  );
}

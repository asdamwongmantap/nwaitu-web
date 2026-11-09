import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import Cta from '@/components/Cta';
import { idDariSlug, muatKajian } from '@/lib/kajian';
import { berikutnya, jadwalTeks, keteranganJam, labelMode, labelPeserta } from '@/lib/kajian-util';
import { situs } from '@/lib/situs';
import { tanggalPanjang } from '@/lib/waktu';

export const revalidate = 21600;
export const dynamicParams = true;

export function generateStaticParams() {
  return []; // dibuat saat pertama dikunjungi
}

type Props = { params: Promise<{ slug: string }> };

const cari = cache(async (slug: string) => {
  const data = await muatKajian();
  const id = idDariSlug(slug);
  const k = data.kajian.find((x) => x.id === id);
  return k ? { k, data } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await cari((await params).slug).catch(() => null);
  if (!r) return { title: 'Kajian tidak ditemukan', robots: { index: false } };
  const { k } = r;
  const tempat = [k.tempat, k.kabkota].filter(Boolean).join(', ');
  return {
    title: k.judul,
    description: `${k.ustadz.join(', ') || 'Kajian'} · ${jadwalTeks(k)} · ${tempat}.`.slice(0, 160),
    alternates: { canonical: `/kajian/${k.slug}/` },
  };
}

export default async function DetailKajian({ params }: Props) {
  const { slug } = await params;
  const r = await cari(slug);
  if (!r) notFound();
  const { k, data } = r;
  if (slug !== k.slug) permanentRedirect(`/kajian/${k.slug}/`);
  const j = berikutnya(k, Date.now(), data.acuan);
  const mode = labelMode(k.mode);
  const peserta = labelPeserta(k.peserta);
  const ld =
    k.tanggal && k.jam
      ? {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: k.judul,
          startDate: `${k.tanggal}T${k.jam}:00+0${{ WIB: 7, WITA: 8, WIT: 9 }[k.zona]}:00`,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode:
            k.mode === 'online'
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : k.mode === 'hybrid'
                ? 'https://schema.org/MixedEventAttendanceMode'
                : 'https://schema.org/OfflineEventAttendanceMode',
          performer: k.ustadz.map((name) => ({ '@type': 'Person', name })),
          location: {
            '@type': 'Place',
            name: k.tempat,
            address: { '@type': 'PostalAddress', streetAddress: k.alamat ?? undefined, addressLocality: k.kabkota ?? undefined, addressCountry: 'ID' },
          },
          organizer: { '@type': 'Organization', name: k.tempat },
        }
      : null;

  return (
    <main className="wrap baca">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      <p style={{ marginTop: 24 }}>
        <Link href="/kajian/">← Semua kajian</Link>
      </p>
      <div className="lencana">
        {mode && <span className="tag">{mode}</span>}
        {peserta && <span className="tag">Khusus {peserta}</span>}
        {k.tanggalPerkiraan && <span className="tag emas">Tanggal perkiraan</span>}
      </div>
      <h1 style={{ marginTop: 10 }}>{k.judul}</h1>
      {k.subJudul && <p className="muted" style={{ fontSize: '1.05rem', marginTop: 0 }}>{k.subJudul}</p>}
      <dl className="rincian">
        {k.ustadz.length > 0 && (
          <>
            <dt>Pemateri</dt>
            <dd>{k.ustadz.join(', ')}</dd>
          </>
        )}
        <dt>Jadwal</dt>
        <dd>{jadwalTeks(k)}</dd>
        <dt>Waktu</dt>
        <dd>{keteranganJam(k, j)}</dd>
        {j && !k.tanggal && (
          <>
            <dt>Berikutnya</dt>
            <dd>{tanggalPanjang(j.iso)}</dd>
          </>
        )}
        <dt>Tempat</dt>
        <dd>
          {k.tempat}
          {k.alamat && <div className="muted">{k.alamat}</div>}
        </dd>
        {k.kabkota && (
          <>
            <dt>Wilayah</dt>
            <dd>
              {k.kabkota}
              {k.provinsi ? `, ${k.provinsi}` : ''}
            </dd>
          </>
        )}
      </dl>
      {!j && <div className="catatan">Kajian ini sudah lewat atau jadwal berikutnya belum diketahui.</div>}
      <div className="aksi">
        {k.peta && (
          <a className="tombol" href={k.peta} target="_blank" rel="noopener">
            Buka peta
          </a>
        )}
        {k.streaming && (
          <a className="tombol garis" href={k.streaming} target="_blank" rel="noopener nofollow">
            Tonton live
          </a>
        )}
        {k.jadwalSlug && (
          <Link className="tombol garis" href={`/jadwal-sholat/${k.jadwalSlug}/`}>
            Jadwal shalat di sini
          </Link>
        )}
      </div>
      {k.sumber.length > 0 && (
        <>
          <h2>Sumber pengumuman</h2>
          <ul>
            {k.sumber.slice(0, 5).map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener nofollow">
                  {s.nama}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="catatan">
        Jadwal dibaca otomatis dari pengumuman publik sehingga bisa keliru atau berubah. Selalu cek sumbernya sebelum berangkat.
        Pengingat kajian tersedia di aplikasi {situs.nama}.
      </div>
      <Cta />
    </main>
  );
}

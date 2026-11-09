import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import Cta from '@/components/Cta';
import { IkonKajian, IkonMasjid, IkonOrang, IkonTempat } from '@/components/Ikon';
import KepalaHalaman from '@/components/KepalaHalaman';
import TombolPoster from '@/components/TombolPoster';
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

  // Teks jadwal rutin dari sumber kadang diawali simbol atau "Waktu :"; rapikan khusus untuk chip di banner.
  const jadwalRingkas = jadwalTeks(k).replace(/^[^\p{L}\p{N}]+/u, '').replace(/^waktu\s*:\s*/i, '');
  const adaLencana = Boolean(mode || peserta || k.tanggalPerkiraan);
  const wilayah = k.kabkota ? `${k.kabkota}${k.provinsi ? `, ${k.provinsi}` : ''}` : null;

  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      <KepalaHalaman
        kembali={{ href: '/kajian/', label: 'Semua kajian' }}
        label="Kajian"
        ikon={<IkonKajian />}
        judul={k.judul}
        deskripsi={k.subJudul ?? undefined}
        lencana={
          adaLencana ? (
            <>
              {mode && <span className="tag">{mode}</span>}
              {peserta && <span className="tag">Khusus {peserta}</span>}
              {k.tanggalPerkiraan && <span className="tag emas">Tanggal perkiraan</span>}
            </>
          ) : undefined
        }
        info={[jadwalRingkas.charAt(0).toUpperCase() + jadwalRingkas.slice(1), keteranganJam(k, j)]}
      />
      <main className="wrap">
        <section className="saring alat-melayang kartu-rincian" aria-label="Rincian kajian">
          <ul className="rincian-baris">
            {k.ustadz.length > 0 && (
              <li>
                <span className="ubin-ikon kecil">
                  <IkonOrang />
                </span>
                <div>
                  <small>Pemateri</small>
                  <b>{k.ustadz.join(', ')}</b>
                </div>
              </li>
            )}
            {j && !k.tanggal && (
              <li>
                <span className="ubin-ikon kecil">
                  <IkonKajian />
                </span>
                <div>
                  <small>Berikutnya</small>
                  <b>{tanggalPanjang(j.iso)}</b>
                </div>
              </li>
            )}
            <li>
              <span className="ubin-ikon kecil">
                <IkonMasjid />
              </span>
              <div>
                <small>Tempat</small>
                <b>{k.tempat}</b>
                {k.alamat && <span className="muted">{k.alamat}</span>}
              </div>
            </li>
            {wilayah && (
              <li>
                <span className="ubin-ikon kecil">
                  <IkonTempat />
                </span>
                <div>
                  <small>Wilayah</small>
                  <b>{wilayah}</b>
                </div>
              </li>
            )}
          </ul>
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
            <TombolPoster
              className="tombol garis"
              label="Buat poster"
              isi={{
                jenis: 'kajian',
                judul: k.judul,
                subJudul: k.subJudul,
                label: [mode, peserta && `Khusus ${peserta}`].filter(Boolean).join(' · ') || null,
                ustadz: k.ustadz,
                jadwal: jadwalTeks(k),
                waktu: keteranganJam(k, j),
                berikutnya: j && !k.tanggal ? tanggalPanjang(j.iso) : null,
                tempat: k.tempat,
                wilayah: k.kabkota ? [k.kabkota, k.provinsi].filter(Boolean).join(', ') : null,
                path: `/kajian/${k.slug}/`,
              }}
            />
          </div>
        </section>

        {!j && <div className="catatan">Kajian ini sudah lewat atau jadwal berikutnya belum diketahui.</div>}

        {k.sumber.length > 0 && (
          <>
            <div className="kepala-bagian bagian">
              <h2>Sumber pengumuman</h2>
            </div>
            <ul className="sumber-daftar">
              {k.sumber.slice(0, 5).map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener nofollow">
                    <span>{s.nama}</span>
                    <span aria-hidden="true">↗</span>
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
    </>
  );
}

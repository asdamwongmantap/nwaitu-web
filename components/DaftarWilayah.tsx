'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { IkonPin, wilayahDariLokasi } from './PilihWilayah';
import { KUNCI_SIMPAN, bacaSimpanan } from './WidgetShalat';

type Data = { provinsi: string; kota: { slug: string; namaTampil: string }[] }[];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '');

export default function DaftarWilayah({ data }: { data: Data }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [simpanan, setSimpanan] = useState<{ slug: string; nama: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const s = bacaSimpanan();
    const k = s && data.flatMap((p) => p.kota).find((x) => x.slug === s);
    if (k) setSimpanan({ slug: k.slug, nama: k.namaTampil });
  }, [data]);

  const hasil = useMemo(() => {
    const kata = norm(q).split(/\s+/).filter(Boolean);
    if (!kata.length) return data;
    return data
      .map((p) => ({ ...p, kota: p.kota.filter((k) => kata.every((x) => norm(`${k.namaTampil} ${p.provinsi}`).includes(x))) }))
      .filter((p) => p.kota.length);
  }, [data, q]);

  async function gps() {
    setStatus('Mencari lokasi…');
    try {
      const slug = await wilayahDariLokasi();
      try {
        localStorage.setItem(KUNCI_SIMPAN, slug);
      } catch {}
      router.push(`/jadwal-sholat/${slug}/`);
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <>
      <div className="saring">
        <input className="cari" type="search" placeholder="Cari kota atau kabupaten…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari kota" />
        <div className="baris">
          <button className="chip ikon" type="button" onClick={gps}>
            <IkonPin />
            Gunakan lokasi saya
          </button>
          {simpanan && (
            <Link className="chip" href={`/jadwal-sholat/${simpanan.slug}/`}>
              Kota Anda: {simpanan.nama}
            </Link>
          )}
          {status && <span className="muted kecil" role="status">{status}</span>}
        </div>
      </div>
      {hasil.length === 0 && <div className="kosong"><b>Tidak ditemukan</b>Tidak ada kota yang cocok dengan “{q}”.</div>}
      {hasil.map((p) => (
        <section key={p.provinsi} className="provinsi">
          <h3>{p.provinsi}</h3>
          <div className="chips">
            {p.kota.map((k) => (
              <Link key={k.slug} className="chip" href={`/jadwal-sholat/${k.slug}/`}>
                {k.namaTampil}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

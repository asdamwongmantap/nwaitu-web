'use client';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { IkonCari } from './Ikon';
import { IkonPin, wilayahDariLokasi } from './PilihWilayah';
import { KUNCI_SIMPAN } from './WidgetShalat';

type Kota = { slug: string; namaTampil: string };
type Data = { provinsi: string; kota: Kota[] }[];

const norm = (s: string) => s.toLowerCase().replace(/\bkab(upaten|\.)?\b/g, 'kabupaten').replace(/[^a-z0-9 ]/g, '');

// Panel pilih kota: cari dengan saran langsung, kota populer, atau lokasi perangkat. Memilih kota
// membuka halaman jadwal kota itu dan mengingat pilihannya untuk beranda.
export default function PilihKota({ data, aktif, populer = [] }: { data: Data; aktif: string; populer?: Kota[] }) {
  const router = useRouter();
  const idDaftar = useId();
  const [status, setStatus] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [terbuka, setTerbuka] = useState(false);
  const [sorot, setSorot] = useState(0);

  const semua = useMemo(() => data.flatMap((p) => p.kota.map((k) => ({ ...k, provinsi: p.provinsi }))), [data]);
  const namaAktif = semua.find((k) => k.slug === aktif)?.namaTampil;
  const hasil = useMemo(() => {
    const kata = norm(q).split(/\s+/).filter(Boolean);
    if (!kata.length) return [];
    // Kota didahulukan dari kabupaten agar "bandung" langsung menampilkan Kota Bandung.
    return semua
      .filter((k) => kata.every((x) => norm(`${k.namaTampil} ${k.provinsi}`).includes(x)))
      .sort((a, b) => Number(a.namaTampil.startsWith('Kab')) - Number(b.namaTampil.startsWith('Kab')))
      .slice(0, 8);
  }, [semua, q]);

  function buka(slug: string) {
    try {
      localStorage.setItem(KUNCI_SIMPAN, slug);
    } catch {}
    router.push(`/jadwal-sholat/${slug}/`);
  }

  async function gps() {
    setStatus('Mencari lokasi…');
    try {
      buka(await wilayahDariLokasi());
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  function tombol(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTerbuka(true);
      setSorot((i) => Math.min(i + 1, hasil.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSorot((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && terbuka && hasil[sorot]) {
      e.preventDefault();
      buka(hasil[sorot].slug);
    } else if (e.key === 'Escape') {
      setTerbuka(false);
    }
  }

  if (!data.length) return null;
  const tampilSaran = terbuka && q.trim().length > 0;
  return (
    <section className="saring alat-melayang panel-kota" aria-label="Pilih kota">
      <div className="pk-kepala">
        <span className="ubin-ikon kecil">
          <IkonPin />
        </span>
        <div className="pk-judul">
          <b>Pilih kota</b>
          <span>
            {semua.length} kabupaten/kota{namaAktif && <> · sekarang {namaAktif}</>}
          </span>
        </div>
      </div>

      <div className="pk-baris">
        <div className="pk-kolom">
          <span className="ikon-cari">
            <IkonCari />
          </span>
          <input
            className="cari"
            type="search"
            role="combobox"
            aria-expanded={tampilSaran}
            aria-controls={idDaftar}
            aria-autocomplete="list"
            aria-activedescendant={tampilSaran && hasil[sorot] ? `${idDaftar}-${sorot}` : undefined}
            aria-label="Cari kota atau kabupaten"
            placeholder="Cari kota atau kabupaten, mis. Bandung"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSorot(0);
              setTerbuka(true);
            }}
            onFocus={() => setTerbuka(true)}
            onBlur={() => setTerbuka(false)}
            onKeyDown={tombol}
          />
          {tampilSaran && (
            // mouseDown dicegah supaya input tidak kehilangan fokus (dan menutup daftar) sebelum klik terbaca.
            <ul id={idDaftar} className="pk-saran" role="listbox" onMouseDown={(e) => e.preventDefault()}>
              {hasil.length ? (
                hasil.map((k, i) => (
                  <li key={k.slug} id={`${idDaftar}-${i}`} role="option" aria-selected={i === sorot} onMouseEnter={() => setSorot(i)} onClick={() => buka(k.slug)}>
                    <span>{k.namaTampil}</span>
                    <small>{k.provinsi}</small>
                  </li>
                ))
              ) : (
                <li className="kosong-saran" role="option" aria-selected="false" aria-disabled="true">
                  Tidak ada yang cocok dengan “{q.trim()}”
                </li>
              )}
            </ul>
          )}
        </div>
        <button className="tombol" type="button" onClick={gps}>
          <IkonPin />
          Gunakan lokasi saya
        </button>
      </div>

      {populer.length > 0 && (
        <div className="pk-populer" role="group" aria-label="Kota populer">
          <span className="label-kecil">Populer</span>
          {populer.map((k) => (
            <button key={k.slug} className="chip" type="button" aria-current={k.slug === aktif ? 'true' : undefined} onClick={() => buka(k.slug)}>
              {k.namaTampil.replace(/^Kota /, '')}
            </button>
          ))}
        </div>
      )}
      {status && (
        <p className="muted kecil" role="status" style={{ margin: 0 }}>
          {status}
        </p>
      )}
    </section>
  );
}

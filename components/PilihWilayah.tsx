'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

export type WilayahRingkas = { slug: string; namaTampil: string; provinsi: string };

let cache: Promise<WilayahRingkas[]> | null = null;
function muatDaftar() {
  cache ??= fetch('/api/wilayah/')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}

const norm = (s: string) => s.toLowerCase().replace(/\bkab(upaten|\.)?\b/g, 'kabupaten').replace(/[^a-z0-9 ]/g, '');

export const IkonPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
const IkonGps = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

/** Minta lokasi perangkat lalu cari kab/kota yang cocok di server. */
export async function wilayahDariLokasi(): Promise<string> {
  if (!('geolocation' in navigator)) throw new Error('Peramban ini tidak mendukung lokasi.');
  const pos = await new Promise<GeolocationPosition>((ok, gagal) =>
    navigator.geolocation.getCurrentPosition(ok, gagal, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }),
  ).catch((e: GeolocationPositionError) => {
    throw new Error(e.code === 1 ? 'Izin lokasi ditolak. Pilih kota secara manual.' : 'Lokasi tidak dapat dibaca.');
  });
  const r = await fetch(`/api/lokasi/?lat=${pos.coords.latitude.toFixed(4)}&lng=${pos.coords.longitude.toFixed(4)}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.slug) throw new Error(j.galat || 'Daerah Anda tidak ditemukan. Pilih kota secara manual.');
  return j.slug as string;
}

export default function PilihWilayah({
  aktif,
  onPilih,
  onTutup,
}: {
  aktif?: string;
  onPilih: (slug: string) => void;
  onTutup: () => void;
}) {
  const [daftar, setDaftar] = useState<WilayahRingkas[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [mencari, setMencari] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    muatDaftar().then(setDaftar, () => setGalat('Daftar kota tidak dapat dimuat. Coba lagi nanti.'));
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    document.addEventListener('keydown', esc);
    const lama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = lama;
    };
  }, [onTutup]);

  const hasil = useMemo(() => {
    if (!daftar) return [];
    const kata = norm(q).split(/\s+/).filter(Boolean);
    const cocok = kata.length ? daftar.filter((w) => kata.every((k) => norm(`${w.namaTampil} ${w.provinsi}`).includes(k))) : daftar;
    // Kota dulu, lalu kabupaten, supaya "bandung" langsung menampilkan Kota Bandung.
    return [...cocok].sort((a, b) => Number(a.namaTampil.startsWith('Kab')) - Number(b.namaTampil.startsWith('Kab'))).slice(0, 80);
  }, [daftar, q]);

  async function gps() {
    setMencari(true);
    setGalat(null);
    try {
      onPilih(await wilayahDariLokasi());
    } catch (e) {
      setGalat((e as Error).message);
    } finally {
      setMencari(false);
    }
  }

  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-label="Pilih kota" onClick={(e) => e.target === e.currentTarget && onTutup()}>
      <div className="dialog-isi">
        <div className="dialog-kepala">
          <div className="baris">
            <b>Pilih kabupaten/kota</b>
            <button className="tutup" type="button" onClick={onTutup} aria-label="Tutup">
              ×
            </button>
          </div>
          <input
            ref={input}
            className="cari"
            type="search"
            placeholder="Cari kota atau kabupaten…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && hasil[0] && onPilih(hasil[0].slug)}
          />
          <button className="tombol-gps" type="button" onClick={gps} disabled={mencari}>
            <IkonGps />
            {mencari ? 'Mencari lokasi…' : 'Gunakan lokasi saya'}
          </button>
          {galat && <div className="muted kecil" role="alert">{galat}</div>}
        </div>
        <div className="dialog-daftar">
          {!daftar && !galat && <p className="muted" style={{ padding: 12 }}>Memuat daftar kota…</p>}
          {daftar && !hasil.length && <p className="muted" style={{ padding: 12 }}>Tidak ada yang cocok dengan “{q}”.</p>}
          {hasil.map((w) => (
            <button key={w.slug} type="button" aria-current={w.slug === aktif} onClick={() => onPilih(w.slug)}>
              {w.namaTampil}
              <span>{w.provinsi}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

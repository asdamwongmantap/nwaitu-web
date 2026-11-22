'use client';
import { useEffect, useState } from 'react';

export type Bab = { id: string; judul: string };

/** Garis tipis di atas layar yang memanjang sesuai seberapa jauh isi artikel sudah dibaca. */
export function ProgresBaca({ target }: { target: string }) {
  const [persen, setPersen] = useState(0);
  useEffect(() => {
    const el = document.getElementById(target);
    if (!el) return;
    let bingkai = 0;
    const hitung = () => {
      bingkai = 0;
      const r = el.getBoundingClientRect();
      const jarak = r.height - window.innerHeight * 0.6;
      setPersen(Math.min(100, Math.max(0, (-r.top / Math.max(1, jarak)) * 100)));
    };
    const jadwal = () => { if (!bingkai) bingkai = requestAnimationFrame(hitung); };
    hitung();
    window.addEventListener('scroll', jadwal, { passive: true });
    window.addEventListener('resize', jadwal);
    return () => {
      cancelAnimationFrame(bingkai);
      window.removeEventListener('scroll', jadwal);
      window.removeEventListener('resize', jadwal);
    };
  }, [target]);
  return <div className="progres-baca" style={{ transform: `scaleX(${persen / 100})` }} aria-hidden="true" />;
}

/**
 * Daftar isi dari subjudul (h2) artikel.
 * - `samping`: kolom samping desktop yang ikut menggulir, bagian yang sedang dibaca disorot.
 * - `lipat`: panel lipat di atas isi (ponsel), supaya layar tidak penuh.
 */
export function DaftarIsi({ bab, varian }: { bab: Bab[]; varian: 'samping' | 'lipat' }) {
  const [aktif, setAktif] = useState<string | null>(null);

  useEffect(() => {
    if (varian !== 'samping') return;
    const el = bab.map((b) => document.getElementById(b.id)).filter((x): x is HTMLElement => Boolean(x));
    if (!el.length) return;
    // Subjudul yang terakhir melewati sepertiga atas layar dianggap bagian yang sedang dibaca.
    const amati = new IntersectionObserver(
      () => {
        const batas = window.innerHeight / 3;
        let kini: string | null = null;
        for (const h of el) if (h.getBoundingClientRect().top <= batas) kini = h.id;
        setAktif(kini);
      },
      { rootMargin: '0px 0px -66% 0px', threshold: [0, 1] },
    );
    el.forEach((h) => amati.observe(h));
    return () => amati.disconnect();
  }, [bab, varian]);

  const daftar = (
    <ol>
      {bab.map((b) => (
        <li key={b.id}>
          <a href={`#${b.id}`} aria-current={aktif === b.id ? 'location' : undefined}>
            {b.judul}
          </a>
        </li>
      ))}
    </ol>
  );

  if (varian === 'lipat') {
    return (
      <details className="daftar-isi lipat">
        <summary>
          Daftar isi <span className="muted">· {bab.length} bagian</span>
        </summary>
        <nav aria-label="Daftar isi">{daftar}</nav>
      </details>
    );
  }
  return (
    <nav className="daftar-isi samping" aria-label="Daftar isi">
      <p className="di-judul">Daftar isi</p>
      {daftar}
    </nav>
  );
}

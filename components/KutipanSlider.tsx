'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import TombolPoster from '@/components/TombolPoster';
import { sumberKutipan, type Kutipan } from '@/lib/kutipan';

/** Kartu "Kutipan hari ini": geser menyamping, tombol bagikan mengikuti kutipan yang tampil. */
export default function KutipanSlider({ data }: { data: Kutipan[] }) {
  const jalur = useRef<HTMLUListElement>(null);
  const [aktif, setAktif] = useState(0);

  const ke = useCallback(
    (i: number) => {
      const el = jalur.current;
      if (!el) return;
      const n = (i + data.length) % data.length; // berputar: dari kutipan terakhir kembali ke yang pertama
      el.scrollTo({ left: n * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    },
    [data.length],
  );

  useEffect(() => {
    const el = jalur.current;
    if (!el) return;
    const baca = () => setAktif(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', baca, { passive: true });
    return () => el.removeEventListener('scroll', baca);
  }, []);

  const k = data[aktif] ?? data[0];
  return (
    <section className="kutipan-bagian" aria-roledescription="carousel" aria-labelledby="judul-kutipan">
      <div className="kutipan-kartu">
        <div className="kutipan-atas">
          <h2 id="judul-kutipan">Kutipan hari ini</h2>
          <span className="kutipan-hitung" aria-hidden="true">
            <b>{String(aktif + 1).padStart(2, '0')}</b> / {String(data.length).padStart(2, '0')}
          </span>
        </div>

        <ul className="kutipan-jalur" ref={jalur} tabIndex={0} aria-live="polite">
          {data.map((x, i) => {
            return (
            <li key={i} className="kutipan-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} dari ${data.length}`}>
              <blockquote>{x.teks}</blockquote>
              {(x.penutur || x.rujukan) && (
                <p className="kutipan-asal">
                  {x.jenis && <span className="kutipan-jenis">{x.jenis}</span>}
                  {x.penutur && <b>{x.penutur}</b>}
                  {x.rujukan && <span>{x.rujukan}</span>}
                </p>
              )}
            </li>
            );
          })}
        </ul>

        <div className="kutipan-bawah">
          <div className="kutipan-titik" role="group" aria-label="Pilih kutipan">
            {data.map((_, i) => (
              <button key={i} type="button" onClick={() => ke(i)} aria-label={`Kutipan ${i + 1}`} aria-current={i === aktif || undefined} />
            ))}
          </div>
          <div className="kutipan-aksi">
            <button className="kutipan-panah" type="button" onClick={() => ke(aktif - 1)} aria-label="Kutipan sebelumnya">‹</button>
            <button className="kutipan-panah" type="button" onClick={() => ke(aktif + 1)} aria-label="Kutipan berikutnya">›</button>
            <TombolPoster label="Bagikan" isi={{ jenis: 'kutipan', teks: k.teks, sumber: sumberKutipan(k), tema: k.tema, path: '/' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gambarPoster, namaBerkas, teksBagikan, type Format, type IsiPoster } from '@/lib/poster';

const IkonGambar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

let logo: Promise<HTMLImageElement | null> | null = null;
function muatLogo() {
  logo ??= new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = '/img/logo.png';
  });
  return logo;
}

/** Tombol "Buat gambar": membuka pratinjau poster yang bisa dibagikan atau diunduh. */
export default function TombolPoster({ isi, className = 'chip ikon', label = 'Buat gambar' }: { isi: IsiPoster; className?: string; label?: string }) {
  const [buka, setBuka] = useState(false);
  const tutup = useCallback(() => setBuka(false), []);
  // Induk bisa re-render tiap detik (hitung mundur); bandingkan isinya, bukan objeknya.
  const kunci = JSON.stringify(isi);
  const isiTetap = useMemo(() => JSON.parse(kunci) as IsiPoster, [kunci]);
  return (
    <>
      <button className={className} type="button" onClick={() => setBuka(true)} aria-haspopup="dialog" aria-label={label}>
        <IkonGambar />
        <span className="label-tombol">{label}</span>
      </button>
      {/* Di <body>, bukan di tempat tombol: tombol bisa berada di banner yang punya gaya sendiri. */}
      {buka && createPortal(<DialogPoster isi={isiTetap} onTutup={tutup} />, document.body)}
    </>
  );
}

function DialogPoster({ isi, onTutup }: { isi: IsiPoster; onTutup: () => void }) {
  const akar = useRef<HTMLDivElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>('kotak');
  const [berkas, setBerkas] = useState<{ file: File; url: string } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [bisaBagikan, setBisaBagikan] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [alamat, setAlamat] = useState('');

  useEffect(() => {
    setAlamat(location.origin + isi.path);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    document.addEventListener('keydown', esc);
    const lama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = lama;
    };
  }, [isi.path, onTutup]);

  useEffect(() => {
    let batal = false;
    let url: string | null = null;
    setBerkas(null);
    setGalat(null);
    (async () => {
      try {
        const css = getComputedStyle(akar.current ?? document.documentElement);
        const huruf = {
          sans: `${css.getPropertyValue('--font-jakarta').trim() || "'Plus Jakarta Sans'"}, system-ui, sans-serif`,
          arab: `${css.getPropertyValue('--font-amiri').trim() || "'Amiri'"}, 'Traditional Arabic', serif`,
        };
        // Pastikan font sudah terunduh sebelum menggambar; bila gagal, pakai font cadangan.
        await Promise.all([
          document.fonts.load(`500 40px ${huruf.sans}`),
          document.fonts.load(`800 40px ${huruf.sans}`),
          isi.jenis === 'ayat' ? document.fonts.load(`40px ${huruf.arab}`, isi.arab) : null,
        ]).catch(() => {});
        const img = await muatLogo();
        if (batal || !kanvas.current) return;
        gambarPoster(kanvas.current, isi, format, huruf, img, location.host);
        const blob = await new Promise<Blob | null>((ok) => kanvas.current!.toBlob(ok, 'image/png'));
        if (batal) return;
        if (!blob) throw new Error('kosong');
        const file = new File([blob], namaBerkas(isi, format), { type: 'image/png' });
        url = URL.createObjectURL(blob);
        setBerkas({ file, url });
        setBisaBagikan(typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }));
      } catch {
        if (!batal) setGalat('Gambar tidak dapat dibuat di peramban ini.');
      }
    })();
    return () => {
      batal = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [isi, format]);

  async function bagikan() {
    if (!berkas) return;
    setStatus(null);
    try {
      // Dipanggil langsung dari klik supaya diizinkan peramban; berkas sudah disiapkan.
      await navigator.share({ files: [berkas.file], text: teksBagikan(isi, alamat) });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('Gagal membagikan. Unduh gambar lalu kirim manual.');
    }
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(teksBagikan(isi, alamat));
      setStatus('Teks disalin.');
    } catch {
      setStatus('Teks tidak dapat disalin.');
    }
  }

  return (
    <div ref={akar} className="dialog" role="dialog" aria-modal="true" aria-label="Bagikan sebagai gambar" onClick={(e) => e.target === e.currentTarget && onTutup()}>
      <div className="dialog-isi poster">
        <div className="dialog-kepala">
          <div className="baris">
            <b>Bagikan sebagai gambar</b>
            <button className="tutup" type="button" onClick={onTutup} aria-label="Tutup">
              ×
            </button>
          </div>
          <div className="chips" role="group" aria-label="Ukuran gambar" style={{ margin: 0 }}>
            {(
              [
                ['kotak', 'Kotak 1:1', 'Chat & feed'],
                ['story', 'Story 9:16', 'Status WA & story IG'],
              ] as const
            ).map(([v, n, ket]) => (
              <button key={v} className="chip" type="button" aria-pressed={format === v} onClick={() => setFormat(v)} title={ket}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="poster-pratinjau">
          <canvas ref={kanvas} className={berkas ? undefined : 'memuat'} role="img" aria-label="Pratinjau gambar" />
          {!berkas && !galat && <p className="muted">Menyiapkan gambar…</p>}
          {galat && <p className="galat-teks" role="alert">{galat}</p>}
        </div>
        <div className="poster-aksi">
          {bisaBagikan && (
            <button className="tombol" type="button" onClick={bagikan} disabled={!berkas}>
              Bagikan ke WA / IG…
            </button>
          )}
          {berkas ? (
            <a className={bisaBagikan ? 'tombol garis' : 'tombol'} href={berkas.url} download={berkas.file.name}>
              Unduh gambar
            </a>
          ) : (
            <span className="tombol garis" aria-disabled="true">
              Unduh gambar
            </span>
          )}
          <a className="tombol garis" href={`https://wa.me/?text=${encodeURIComponent(teksBagikan(isi, alamat))}`} target="_blank" rel="noopener">
            Kirim teks ke WhatsApp
          </a>
          <button className="tombol garis" type="button" onClick={salin}>
            Salin teks
          </button>
          <p className="muted kecil" role="status">
            {status ??
              (bisaBagikan
                ? 'Pilih WhatsApp atau Instagram dari menu bagikan.'
                : 'Unduh gambar, lalu unggah dari galeri ke WhatsApp atau Instagram.')}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { IkonFacebook, IkonTelegram, IkonWhatsApp, IkonX } from '@/components/IkonMerek';

type Varian = 'ikon' | 'lengkap';

const IkonBagikan = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
const IkonTautan = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);
const IkonCentang = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Tombol bagikan artikel. Alamat diambil dari halaman yang sedang dibuka (domain yang dipakai pengunjung),
 * dengan `path` sebagai cadangan saat render server.
 * - `ikon`: deretan ikon bulat (kolom samping desktop).
 * - `lengkap`: tombol berlabel untuk kartu di akhir artikel.
 */
export default function BagikanArtikel({ judul, ringkas, path, varian }: { judul: string; ringkas: string; path: string; varian: Varian }) {
  const [url, setUrl] = useState(path);
  const [bisaNative, setBisaNative] = useState(false);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin + path);
    setBisaNative(typeof navigator.share === 'function');
  }, [path]);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Peramban lama / tanpa izin clipboard: pakai cara manual.
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2200);
  };

  const native = async () => {
    try {
      await navigator.share({ title: judul, text: ringkas, url });
    } catch {
      // Pengguna menutup lembar bagikan: tidak perlu apa-apa.
    }
  };

  const teks = `${judul}\n\n${ringkas}`;
  const e = encodeURIComponent;
  const tujuan = [
    { nama: 'WhatsApp', kelas: 'wa', ikon: <IkonWhatsApp />, href: `https://wa.me/?text=${e(`${teks}\n\n${url}`)}` },
    { nama: 'Telegram', kelas: 'tg', ikon: <IkonTelegram />, href: `https://t.me/share/url?url=${e(url)}&text=${e(teks)}` },
    { nama: 'X', kelas: 'x', ikon: <IkonX />, href: `https://twitter.com/intent/tweet?text=${e(judul)}&url=${e(url)}` },
    { nama: 'Facebook', kelas: 'fb', ikon: <IkonFacebook />, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
  ];
  const status = (
    <span className="sr-only" role="status">
      {tersalin ? 'Tautan artikel tersalin' : ''}
    </span>
  );

  if (varian === 'ikon') {
    return (
      <div className="bagikan-ikon" role="group" aria-label="Bagikan artikel">
        {tujuan.map((t) => (
          <a key={t.nama} className={`bg-${t.kelas}`} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`Bagikan ke ${t.nama}`} title={t.nama}>
            {t.ikon}
          </a>
        ))}
        <button type="button" onClick={salin} aria-label="Salin tautan" title={tersalin ? 'Tersalin' : 'Salin tautan'}>
          {tersalin ? <IkonCentang /> : <IkonTautan />}
        </button>
        {status}
      </div>
    );
  }

  return (
    <div className="bagikan-lengkap" role="group" aria-label="Bagikan artikel">
      {tujuan.map((t) => (
        <a key={t.nama} className={`bg-${t.kelas}`} href={t.href} target="_blank" rel="noopener noreferrer">
          {t.ikon}
          <span>{t.nama}</span>
        </a>
      ))}
      <button type="button" onClick={salin}>
        {tersalin ? <IkonCentang /> : <IkonTautan />}
        <span>{tersalin ? 'Tersalin' : 'Salin tautan'}</span>
      </button>
      {bisaNative && (
        <button type="button" onClick={native}>
          <IkonBagikan />
          <span>Lainnya</span>
        </button>
      )}
      {status}
    </div>
  );
}

'use client';
import { useLayoutEffect } from 'react';

const KUNCI = 'nawaitu-tema';

function terapkan(tema: string) {
  document.documentElement.setAttribute('data-theme', tema);
}

// Tampilan default terang. Pilihan pengunjung disimpan di localStorage dan dipasang oleh
// skrip kecil di <head> (lihat app/layout.tsx) sebelum halaman tampil, jadi tidak berkedip.
export default function TombolTema() {
  // Pada mode development React Strict Mode menghapus atribut di <html>; pasang ulang.
  useLayoutEffect(() => {
    try {
      const tema = localStorage.getItem(KUNCI);
      if (tema === 'dark' || tema === 'light') terapkan(tema);
    } catch {}
  }, []);

  function ganti() {
    const berikut = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    terapkan(berikut);
    try {
      localStorage.setItem(KUNCI, berikut);
    } catch {}
  }

  return (
    <button type="button" className="tombol-tema" onClick={ganti} aria-label="Ganti tampilan terang atau gelap" title="Ganti tampilan terang atau gelap">
      <svg className="ikon-bulan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg className="ikon-matahari" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

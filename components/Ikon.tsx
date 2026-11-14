// Ikon garis 24×24 untuk beranda: menu utama dan tiap waktu shalat. Tanpa state,
// jadi bisa dipakai di komponen server maupun klien.
import type { ReactNode } from 'react';
import type { Waktu } from '@/lib/waktu';

const Dasar = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const IkonJadwal = () => (
  <Dasar>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Dasar>
);
export const IkonTempat = () => (
  <Dasar>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Dasar>
);
export const IkonKajian = () => (
  <Dasar>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Dasar>
);
export const IkonArtikel = () => (
  <Dasar>
    <path d="M6 3.5h8.5L19 8v12.5H6z" />
    <path d="M14 3.5V8h5M9 13h7M9 16.5h7" />
  </Dasar>
);

export const IkonMasjid = () => (
  <Dasar>
    <path d="M3 21h18" />
    <path d="M6 21v-6a6 6 0 0 1 12 0v6" />
    <path d="M12 9V4M10.4 5.6h3.2" />
    <path d="M10 21v-2.5a2 2 0 0 1 4 0V21" />
  </Dasar>
);
export const IkonSekolah = () => (
  <Dasar>
    <path d="m2.5 9 9.5-5 9.5 5-9.5 5z" />
    <path d="M6 11.6V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.4" />
    <path d="M21.5 9v6" />
  </Dasar>
);
export const IkonCari = () => (
  <Dasar>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Dasar>
);
export const IkonOrang = () => (
  <Dasar>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.7-3.6 3.4-5.5 7-5.5s6.3 1.9 7 5.5" />
  </Dasar>
);
export const IkonUnduh = () => (
  <Dasar>
    <path d="M12 4v11" />
    <path d="m7.5 11 4.5 4.5 4.5-4.5" />
    <path d="M5 19.5h14" />
  </Dasar>
);

/** Ikon tiap waktu shalat: fajar, terbit, siang, sore, terbenam, malam. */
export function IkonWaktu({ k }: { k: Waktu }) {
  switch (k) {
    case 'subuh':
      return (
        <Dasar>
          <path d="M3 19h18" />
          <path d="M9 19a3 3 0 0 1 6 0" />
          <path d="m12 4 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
        </Dasar>
      );
    case 'terbit':
      return (
        <Dasar>
          <path d="M3 19h18" />
          <path d="M7 19a5 5 0 0 1 10 0" />
          <path d="M12 6v4M5.6 11l1.8 1.8M18.4 11l-1.8 1.8" />
        </Dasar>
      );
    case 'dzuhur':
      return (
        <Dasar>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </Dasar>
      );
    case 'ashar':
      return (
        <Dasar>
          <circle cx="12" cy="13" r="3.5" />
          <path d="M12 5.5v2M5.2 8.7l1.4 1.4M18.8 8.7l-1.4 1.4M3.5 13h2M18.5 13h2M4 20h16" />
        </Dasar>
      );
    case 'maghrib':
      return (
        <Dasar>
          <path d="M3 19h18" />
          <path d="M7 19a5 5 0 0 1 10 0" />
          <path d="M12 4v5M9.8 7l2.2 2.2L14.2 7" />
        </Dasar>
      );
    case 'isya':
      return (
        <Dasar>
          <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z" />
          <path d="m17 3.5.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
        </Dasar>
      );
    default:
      return (
        <Dasar>
          <circle cx="12" cy="12" r="8" />
        </Dasar>
      );
  }
}

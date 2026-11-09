'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const Ikon = ({ children }: { children: ReactNode }) => (
  <svg className="ikon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// [alamat, label, label pendek di bilah tab ponsel, ikon]
const MENU: readonly (readonly [string, string, string, ReactNode])[] = [
  ['/', 'Beranda', 'Beranda', <Ikon key="b"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></Ikon>],
  ['/jadwal-sholat/', 'Jadwal Shalat', 'Jadwal', <Ikon key="j"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ikon>],
  ['/masjid-terdekat/', 'Masjid & Sekolah', 'Terdekat', <Ikon key="m"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></Ikon>],
  ['/kajian/', 'Kajian', 'Kajian', <Ikon key="k"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Ikon>],
  ['/artikel/', 'Artikel', 'Artikel', <Ikon key="a"><path d="M6 3.5h8.5L19 8v12.5H6z" /><path d="M14 3.5V8h5M9 13h7M9 16.5h7" /></Ikon>],
];

// Di layar lebar tampil sebagai menu di header; di ponsel menjadi bilah tab di bawah layar.
export default function Menu() {
  const path = usePathname() || '/';
  const aktif = (h: string) => (h === '/' ? path === '/' : path.startsWith(h.replace(/\/$/, '')));
  return (
    <nav className="menu" aria-label="Menu utama">
      {MENU.map(([h, n, pendek, ikon]) => (
        <Link key={h} href={h} aria-current={aktif(h) ? 'page' : undefined}>
          {ikon}
          <span className="label-panjang">{n}</span>
          <span className="label-pendek">{pendek}</span>
        </Link>
      ))}
    </nav>
  );
}

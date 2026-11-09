'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU = [
  ['/', 'Beranda'],
  ['/jadwal-sholat/', 'Jadwal Shalat'],
  ['/kajian/', 'Kajian'],
  ['/artikel/', 'Artikel'],
] as const;

export default function Menu() {
  const path = usePathname() || '/';
  const aktif = (h: string) => (h === '/' ? path === '/' : path.startsWith(h.replace(/\/$/, '')));
  return (
    <nav className="menu" aria-label="Menu utama">
      {MENU.map(([h, n]) => (
        <Link key={h} href={h} aria-current={aktif(h) ? 'page' : undefined}>
          {n}
        </Link>
      ))}
    </nav>
  );
}

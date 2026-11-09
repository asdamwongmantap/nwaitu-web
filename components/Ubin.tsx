import Link from 'next/link';
import type { ReactNode } from 'react';

/** Ubin menu utama: ikon, judul, keterangan singkat, dan panah. */
export default function Ubin({ href, ikon, judul, ket }: { href: string; ikon: ReactNode; judul: string; ket: string }) {
  return (
    <Link className="ubin" href={href}>
      <span className="ubin-ikon">{ikon}</span>
      <b>{judul}</b>
      <span className="ubin-ket">{ket}</span>
      <span className="ubin-panah" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

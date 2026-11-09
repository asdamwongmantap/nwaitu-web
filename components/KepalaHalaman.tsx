import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Banner halaman dalam: label, judul, deskripsi, lencana, dan chip info di atas latar hijau
 * berpola. Panel yang diberi class `alat-melayang` (atau kartu baca) dan diletakkan tepat
 * sesudahnya akan menumpuk di tepi bawah banner.
 */
export default function KepalaHalaman({
  label,
  judul,
  deskripsi,
  ikon,
  info = [],
  tanpaAlat = false,
  kembali,
  lencana,
}: {
  label: string;
  judul: string;
  deskripsi?: ReactNode;
  ikon: ReactNode;
  info?: string[];
  tanpaAlat?: boolean; // tidak ada panel yang menumpuk di bawahnya
  kembali?: { href: string; label: string }; // tautan "← Semua ..." di atas label
  lencana?: ReactNode; // tag kecil di bawah deskripsi (mis. mode kajian)
}) {
  return (
    <section className={tanpaAlat ? 'kepala-halaman tanpa-alat' : 'kepala-halaman'}>
      <div className="wrap">
        {kembali && (
          <Link className="kh-kembali" href={kembali.href}>
            <span aria-hidden="true">←</span> {kembali.label}
          </Link>
        )}
        <div className="kh-label">
          <span className="kh-ikon">{ikon}</span>
          {label}
        </div>
        <h1>{judul}</h1>
        {deskripsi && <p className="kh-deskripsi">{deskripsi}</p>}
        {lencana && <div className="kh-lencana">{lencana}</div>}
        {info.length > 0 && (
          <ul className="kh-info">
            {info.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

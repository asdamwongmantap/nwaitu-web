import Link from 'next/link';

export default function TidakDitemukan() {
  return (
    <main className="wrap">
      <h1>Halaman tidak ditemukan</h1>
      <p className="muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <div className="aksi">
        <Link className="tombol" href="/">Kembali ke beranda</Link>
        <Link className="tombol garis" href="/jadwal-sholat/">Jadwal shalat</Link>
        <Link className="tombol garis" href="/kajian/">Jadwal kajian</Link>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import JalurOffline from '@/components/JalurOffline';

export const metadata: Metadata = {
  title: 'Sedang offline',
  robots: { index: false },
};

// Halaman cadangan yang ditampilkan service worker (public/sw.js) bila halaman yang
// diminta belum tersimpan dan tidak ada koneksi.
export default function Offline() {
  return (
    <main className="wrap baca">
      <h1>Anda sedang offline</h1>
      <p>
        Halaman yang Anda buka belum tersimpan di perangkat. Sambungkan ke internet lalu coba lagi. Sementara itu, bagian berikut tetap bisa dipakai:
      </p>
      <JalurOffline />
    </main>
  );
}

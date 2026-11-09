import type { MetadataRoute } from 'next';
import { situs } from '@/lib/situs';

export default function manifest(): MetadataRoute.Manifest {
  const ikon = [{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' }];
  return {
    id: '/',
    name: `${situs.nama}: ${situs.tagline}`,
    short_name: situs.nama,
    description: situs.deskripsi,
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0e3b2e',
    theme_color: '#0e3b2e',
    categories: ['lifestyle', 'utilities', 'education'],
    icons: [
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    // Pintasan saat ikon aplikasi ditekan lama.
    shortcuts: [
      { name: 'Jadwal Shalat', short_name: 'Jadwal', url: '/jadwal-sholat/', icons: ikon },
      { name: 'Artikel Ibadah', short_name: 'Artikel', url: '/artikel/', icons: ikon },
    ],
  };
}

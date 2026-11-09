import type { MetadataRoute } from 'next';
import { situs } from '@/lib/situs';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${situs.nama}: ${situs.tagline}`,
    short_name: situs.nama,
    description: situs.deskripsi,
    lang: 'id',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e3b2e',
    theme_color: '#0e3b2e',
    icons: [
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

import type { NextConfig } from 'next';

// Alamat kota di situs versi lama (sebelum Next.js) diarahkan ke alamat baru.
const KOTA_LAMA = ['jakarta', 'bandung', 'semarang', 'yogyakarta', 'surabaya', 'medan', 'makassar'];

const config: NextConfig = {
  trailingSlash: true,
  turbopack: { root: __dirname },
  // Arsip data/*.json dibaca dengan fs saat runtime (lib/arsip.ts), jadi sertakan ke fungsi server.
  outputFileTracingIncludes: { '/**': ['./data/**/*.json'] },
  async headers() {
    return [
      {
        // Service worker tidak boleh di-cache peramban, supaya pembaruan langsung dipakai.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async redirects() {
    return KOTA_LAMA.map((k) => ({
      source: `/jadwal-sholat/${k}/`,
      destination: `/jadwal-sholat/kota-${k}/`,
      permanent: true,
    }));
  },
};

export default config;

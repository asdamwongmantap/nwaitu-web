import type { NextConfig } from 'next';

// Alamat kota di situs versi lama (sebelum Next.js) diarahkan ke alamat baru.
const KOTA_LAMA = ['jakarta', 'bandung', 'semarang', 'yogyakarta', 'surabaya', 'medan', 'makassar'];

const config: NextConfig = {
  trailingSlash: true,
  turbopack: { root: __dirname },
  async redirects() {
    return KOTA_LAMA.map((k) => ({
      source: `/jadwal-sholat/${k}/`,
      destination: `/jadwal-sholat/kota-${k}/`,
      permanent: true,
    }));
  },
};

export default config;

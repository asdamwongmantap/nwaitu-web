import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Menu from '@/components/Menu';
import Pwa, { PanelPwa } from '@/components/Pwa';
import TombolTema from '@/components/TombolTema';
import { amiri, jakarta } from '@/lib/fonts';
import { artikel, situs } from '@/lib/situs';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(situs.url),
  title: { default: `${situs.nama}: ${situs.tagline}`, template: `%s | ${situs.nama}` },
  description: situs.deskripsi,
  applicationName: situs.nama,
  openGraph: {
    siteName: situs.nama,
    locale: 'id_ID',
    type: 'website',
    images: [{ url: '/img/og-image.png', width: 1024, height: 500, alt: `${situs.nama}: ${situs.tagline}` }],
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { capable: true, title: situs.nama, statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/img/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/img/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/img/apple-touch-icon.png',
  },
};

export const viewport: Viewport = { themeColor: '#0e3b2e' };

// Dijalankan sebelum halaman tampil: pasang tema pilihan pengunjung (default terang, tidak mengikuti OS).
// Halaman yang disimpan ke perangkat agar bisa dibuka offline (lihat public/sw.js).
const HALAMAN_OFFLINE = ['/offline/', '/', '/jadwal-sholat/', '/artikel/', ...artikel.map((a) => `/artikel/${a.slug}/`)];

const SKRIP_TEMA = `(function(){try{var t=localStorage.getItem("nawaitu-tema");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" className={`${jakarta.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body>
        <header className="top">
          <div className="wrap">
            <Link className="logo" href="/">
              <img src="/img/logo.png" alt="" width={22} height={28} />
              {situs.nama}
            </Link>
            <TombolTema />
            <Menu />
          </div>
        </header>
        <Pwa halaman={HALAMAN_OFFLINE} />
        {children}
        <footer>
          <div className="wrap kaki">
            <div className="kaki-merek">
              <Link className="logo" href="/">
                <img src="/img/logo.png" alt="" width={22} height={28} />
                {situs.nama}
              </Link>
              <p>{situs.tagline}. Jadwal shalat, kajian, dan artikel ibadah dalam satu tempat.</p>
            </div>
            <nav className="kaki-tautan" aria-label="Tautan di kaki halaman">
              <Link href="/jadwal-sholat/">Jadwal Shalat</Link>
              <Link href="/masjid-terdekat/">Masjid & Sekolah</Link>
              <Link href="/kajian/">Kajian</Link>
              <Link href="/artikel/">Artikel</Link>
            </nav>
            <div className="kaki-catatan">
              <p>
                © {new Date().getFullYear()} {situs.nama}. Jadwal shalat bersumber dari Kemenag RI (Bimas Islam) melalui
                API <a href="https://equran.id" rel="noopener">EQuran.id</a>.
              </p>
              <p>Jadwal kajian dihimpun otomatis dari pengumuman publik; selalu cek sumbernya sebelum berangkat.</p>
              <PanelPwa />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

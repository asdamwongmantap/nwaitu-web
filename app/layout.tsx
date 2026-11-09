import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import Menu from '@/components/Menu';
import { situs } from '@/lib/situs';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <header className="top">
          <div className="wrap">
            <Link className="logo" href="/">
              <img src="/img/logo.png" alt="" width={22} height={28} />
              {situs.nama}
            </Link>
            <Menu />
          </div>
        </header>
        {children}
        <footer>
          <div className="wrap">
            <p>
              © {new Date().getFullYear()} {situs.nama}. Jadwal shalat bersumber dari Kemenag RI (Bimas Islam) melalui
              API <a href="https://equran.id" rel="noopener">EQuran.id</a>.
            </p>
            <p>Jadwal kajian dihimpun otomatis dari pengumuman publik; selalu cek sumbernya sebelum berangkat.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

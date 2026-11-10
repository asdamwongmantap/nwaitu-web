'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KUNCI_SIMPAN } from './WidgetShalat';

// Service worker hanya dipasang di build produksi: di `next dev` ia akan menyajikan
// berkas lama dan mengganggu hot reload.
const AKTIF = process.env.NODE_ENV === 'production';

// Tombol "Pasang aplikasi" disembunyikan sampai aplikasinya rilis. Ubah ke true untuk memunculkannya lagi.
const TAMPILKAN_PASANG = false;

const KUNCI_SIAP = 'nawaitu_offline_siap'; // kunci sinkron terakhir yang berhasil penuh
const KUNCI_COBA = 'nawaitu_offline_coba'; // waktu percobaan terakhir yang belum penuh
const ULANG_SETELAH = 30 * 60e3;
const PERISTIWA = 'nawaitu:pwa';

type PromptPasang = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let tundaPasang: PromptPasang | null = null;
let kunciBerjalan: string | null = null;

const baca = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const tulis = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const kabar = () => window.dispatchEvent(new Event(PERISTIWA));

/** Simpan halaman inti dan jadwal kota pilihan ke perangkat, paling banyak sekali sehari per kota. */
async function sinkron(halaman: string[]) {
  const slug = baca(KUNCI_SIMPAN) || 'kota-jakarta';
  const kunci = `${new Date().toISOString().slice(0, 10)}|${slug}|${halaman.length}`;
  if (baca(KUNCI_SIAP) === kunci || kunciBerjalan === kunci) return;
  if (Date.now() - Number(baca(KUNCI_COBA) ?? 0) < ULANG_SETELAH) return;
  kunciBerjalan = kunci;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: 'SIMPAN', urls: [...halaman, `/jadwal-sholat/${slug}/`, `/api/jadwal/${slug}/`, '/api/wilayah/'], kunci });
}

/** Pasang service worker, simpan halaman untuk offline, dan tampilkan spanduk bila koneksi putus. */
export default function Pwa({ halaman }: { halaman: string[] }) {
  const path = usePathname();
  const [offline, setOffline] = useState(false);
  const didukung = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (!AKTIF) {
      // Sisa service worker dari uji produksi di alamat yang sama jangan sampai menyajikan berkas basi.
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      if ('caches' in window) caches.keys().then((ks) => ks.filter((k) => k.startsWith('nawaitu-')).forEach((k) => caches.delete(k))).catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    const pesan = (e: MessageEvent) => {
      const d = e.data;
      if (d?.type !== 'SIAP') return;
      if (d.berhasil >= d.total) tulis(KUNCI_SIAP, d.kunci);
      else tulis(KUNCI_COBA, String(Date.now())); // sebagian gagal: coba lagi nanti, jangan terus-menerus
      kunciBerjalan = null;
      kabar();
    };
    const sebelum = (e: Event) => {
      e.preventDefault();
      tundaPasang = e as PromptPasang;
      kabar();
    };
    navigator.serviceWorker.addEventListener('message', pesan);
    window.addEventListener('beforeinstallprompt', sebelum);
    window.addEventListener('appinstalled', () => {
      tundaPasang = null;
      kabar();
    });
    return () => {
      navigator.serviceWorker.removeEventListener('message', pesan);
      window.removeEventListener('beforeinstallprompt', sebelum);
    };
  }, []);

  // Cek ulang setiap pindah halaman: kota pilihan pengunjung bisa berubah kapan saja.
  useEffect(() => {
    if (AKTIF && didukung && navigator.onLine) sinkron(halaman).catch(() => {});
  }, [path, halaman, didukung]);

  useEffect(() => {
    const perbarui = () => setOffline(!navigator.onLine);
    perbarui();
    window.addEventListener('online', perbarui);
    window.addEventListener('offline', perbarui);
    return () => {
      window.removeEventListener('online', perbarui);
      window.removeEventListener('offline', perbarui);
    };
  }, []);

  return offline ? (
    <div className="banner-offline" role="status">
      Anda sedang offline. Halaman yang sudah tersimpan tetap bisa dibuka.
    </div>
  ) : null;
}

/** Status kesiapan offline dan tombol pasang aplikasi (di kaki halaman). */
export function PanelPwa() {
  const [siap, setSiap] = useState(false);
  const [bisaPasang, setBisaPasang] = useState(false);
  const [terpasang, setTerpasang] = useState(false);
  const [ios, setIos] = useState(false);
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    if (!AKTIF || !('serviceWorker' in navigator)) return;
    setTampil(true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setTerpasang(matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true);
    const segarkan = () => {
      setSiap(Boolean(baca(KUNCI_SIAP)));
      setBisaPasang(tundaPasang != null);
    };
    segarkan();
    window.addEventListener(PERISTIWA, segarkan);
    return () => window.removeEventListener(PERISTIWA, segarkan);
  }, []);

  async function pasang() {
    const p = tundaPasang;
    if (!p) return;
    await p.prompt();
    await p.userChoice.catch(() => {});
    tundaPasang = null;
    setBisaPasang(false);
  }

  if (!tampil) return null;
  return (
    <div className="panel-pwa">
      {siap && <span className="muted kecil">✓ Jadwal shalat dan artikel tersimpan untuk dipakai offline.</span>}
      {TAMPILKAN_PASANG && !terpasang && bisaPasang && (
        <button className="chip" type="button" onClick={pasang}>
          Pasang aplikasi
        </button>
      )}
      {TAMPILKAN_PASANG && !terpasang && ios && <span className="muted kecil">Di iPhone/iPad: ketuk Bagikan, lalu “Tambah ke Layar Utama”.</span>}
    </div>
  );
}

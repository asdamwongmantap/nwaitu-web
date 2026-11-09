// Service worker Nawaitu: membuat jadwal shalat dan artikel ibadah tetap
// bisa dibuka saat koneksi lambat atau offline. Tanpa dependensi.
//
// Strategi:
//  - /_next/static/*     cache-first (berkas ber-hash, tidak pernah berubah)
//  - halaman (navigasi)  jaringan dulu; bila lambat (> TUNGGU_HALAMAN) atau gagal,
//                        pakai salinan tersimpan; bila tidak ada, halaman /offline/
//  - /api/jadwal, /api/wilayah  sama seperti halaman (TUNGGU_DATA)
//  - gambar, ikon        tampilkan yang tersimpan sambil diperbarui di latar belakang
//  - lainnya (/api/lokasi, /api/sekitar, ...) tidak disentuh
//
// Naikkan VERSI bila strategi di sini berubah; cache versi lama dihapus otomatis.
const VERSI = 'v1';
const CACHE_HALAMAN = `nawaitu-halaman-${VERSI}`;
const CACHE_ASET = `nawaitu-aset-${VERSI}`;
const CACHE_DATA = `nawaitu-data-${VERSI}`;
const SEMUA_CACHE = [CACHE_HALAMAN, CACHE_ASET, CACHE_DATA];
// Batas jumlah entri; yang paling lama disimpan dibuang lebih dulu.
const BATAS_ENTRI = { [CACHE_HALAMAN]: 120, [CACHE_ASET]: 300, [CACHE_DATA]: 80 };

const TUNGGU_HALAMAN = 3500; // ms sebelum salinan tersimpan ditampilkan
const TUNGGU_DATA = 4000;
const HALAMAN_OFFLINE = '/offline/';

const kunciHalaman = (url) => url.origin + url.pathname;

// ---------- Pasang & aktifkan ----------

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Halaman cadangan wajib ada sebelum apa pun, supaya offline tidak menampilkan galat peramban.
  event.waitUntil(simpanHalaman(HALAMAN_OFFLINE).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const nama of await caches.keys()) {
        if (nama.startsWith('nawaitu-') && !SEMUA_CACHE.includes(nama)) await caches.delete(nama);
      }
      await self.clients.claim();
    })(),
  );
});

// ---------- Penyimpanan ----------

let sejakPangkas = 0;
async function pangkas(namaCache, paksa = false) {
  if (!paksa && ++sejakPangkas < 15) return;
  sejakPangkas = 0;
  const cache = await caches.open(namaCache);
  const kunci = await cache.keys();
  for (let i = 0; i < kunci.length - BATAS_ENTRI[namaCache]; i++) await cache.delete(kunci[i]);
}

// Berkas build (/_next/static/) dan gambar situs (/img/) yang dirujuk sebuah halaman atau CSS.
const RE_ASET = /\/(?:_next\/static|img)\/[^"'\s)\\<>]+/g;
// Selalu ikut disimpan: dirujuk <head> tapi tidak selalu tertulis dengan pola di atas.
const ASET_TETAP = ['/favicon.ico', '/manifest.webmanifest'];

/** Simpan berkas yang dirujuk [teks] (HTML atau CSS), termasuk font di dalam CSS. */
async function simpanAset(teks, tambahan = []) {
  const alamat = [...new Set([...(teks.match(RE_ASET) ?? []), ...tambahan])];
  const cache = await caches.open(CACHE_ASET);
  await Promise.all(
    alamat.map(async (a) => {
      try {
        if (await cache.match(a)) return;
        const res = await fetch(a);
        if (!res.ok) return;
        if (/\.css(\?|$)/.test(a)) await simpanAset(await res.clone().text());
        await cache.put(a, res);
      } catch {
        // Satu berkas gagal tidak boleh menggagalkan yang lain.
      }
    }),
  );
}

/** Ambil halaman dari jaringan lalu simpan bersama JS/CSS/font yang dibutuhkannya. */
async function simpanHalaman(path) {
  const url = new URL(path, self.location.origin);
  const res = await fetch(url);
  // Respons hasil pengalihan tidak boleh dipakai untuk navigasi (ditolak peramban).
  if (!res.ok || res.redirected) return false;
  const teks = await res.clone().text();
  await (await caches.open(CACHE_HALAMAN)).put(kunciHalaman(url), res);
  await simpanAset(teks, ASET_TETAP);
  return true;
}

async function simpanData(path) {
  const res = await fetch(path);
  if (!res.ok) return false;
  await (await caches.open(CACHE_DATA)).put(path, res);
  return true;
}

// ---------- Mode pengembangan ----------

// Hanya ada di HTML `next dev` (klien HMR / React Refresh), tidak pernah di build produksi.
const RE_MODE_DEV = /hmr-client|react-refresh|webpack-hmr/;

async function matikanDiri() {
  for (const nama of await caches.keys()) if (nama.startsWith('nawaitu-')) await caches.delete(nama);
  await self.registration.unregister();
  // Muat ulang tab yang terbuka agar menampilkan halaman dev yang sebenarnya, bukan salinan lama.
  for (const klien of await self.clients.matchAll({ type: 'window' })) klien.navigate(klien.url).catch(() => {});
}

// ---------- Strategi ----------

async function asetDulu(req) {
  const cache = await caches.open(CACHE_ASET);
  const ada = await cache.match(req);
  if (ada) return ada;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone()).then(() => pangkas(CACHE_ASET)).catch(() => {});
  return res;
}

async function tampilkanLaluSegarkan(event) {
  const req = event.request;
  const cache = await caches.open(CACHE_ASET);
  const ada = await cache.match(req);
  const baru = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  if (ada) {
    event.waitUntil(baru);
    return ada;
  }
  // Belum tersimpan: jangan menahan pemuatan halaman selamanya bila koneksi hang.
  event.waitUntil(baru);
  const batas = new Promise((ok) => setTimeout(() => ok(null), TUNGGU_DATA));
  return (await Promise.race([baru, batas])) ?? Response.error();
}

/**
 * Jaringan dulu. Bila ada salinan tersimpan dan jaringan lambat (> [batas] ms),
 * gagal, atau server error, salinan itulah yang ditampilkan; unduhan tetap
 * berjalan di latar belakang dan memperbarui salinan untuk kunjungan berikutnya.
 */
async function jaringanDulu(event, namaCache, kunci, batas, cadanganHalaman) {
  const cache = await caches.open(namaCache);
  const simpanan = await cache.match(kunci);
  const simpanSalinan = async (salinan) => {
    // Halaman dari `next dev`: bukan untuk disimpan. Service worker sisa uji produksi di alamat
    // yang sama mematikan dirinya sendiri supaya tidak menyajikan berkas lama saat mengembangkan.
    if (cadanganHalaman && RE_MODE_DEV.test(await salinan.clone().text())) return matikanDiri();
    await cache.put(kunci, salinan);
    await pangkas(namaCache);
  };
  const jaringan = fetch(event.request).then((res) => {
    const simpan = res.ok && !res.redirected ? simpanSalinan(res.clone()).catch(() => {}) : null;
    return { res, simpan };
  });
  // Biarkan unduhan dan penyimpanan selesai walau tampilan sudah dijawab dari salinan.
  event.waitUntil(jaringan.then((j) => j.simpan, () => {}));
  const hasil = jaringan.then((j) => j.res);

  if (simpanan) {
    const lambat = new Promise((ok) => setTimeout(() => ok(simpanan), batas));
    return Promise.race([hasil.then((res) => (res.status >= 500 ? simpanan : res), () => simpanan), lambat]);
  }
  try {
    return await hasil;
  } catch (galat) {
    if (cadanganHalaman) {
      const offline = await (await caches.open(CACHE_HALAMAN)).match(new URL(HALAMAN_OFFLINE, self.location.origin).href);
      if (offline) return offline;
    }
    throw galat;
  }
}

// ---------- Permintaan ----------

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;

  if (p.startsWith('/_next/static/')) return event.respondWith(asetDulu(req));
  if (p.startsWith('/_next/')) return;
  if (/^\/api\/(jadwal|wilayah)\//.test(p)) return event.respondWith(jaringanDulu(event, CACHE_DATA, p, TUNGGU_DATA, false));
  if (p.startsWith('/api/')) return;
  // Perpindahan antarhalaman di dalam aplikasi (RSC): bila gagal, Next memuat halaman penuh, dan itu dilayani di bawah.
  if (req.headers.get('RSC') || url.searchParams.has('_rsc')) return;
  if (req.mode === 'navigate') return event.respondWith(jaringanDulu(event, CACHE_HALAMAN, kunciHalaman(url), TUNGGU_HALAMAN, true));
  if (/^\/(img\/|favicon\.ico|manifest\.webmanifest)/.test(p)) return event.respondWith(tampilkanLaluSegarkan(event));
});

// ---------- Pesan dari halaman ----------
// {type: 'SIMPAN', urls: ['/artikel/', '/api/jadwal/kota-bandung/', ...], kunci}
// Menyimpan daftar alamat supaya bisa dibuka offline walau belum pernah dikunjungi.

self.addEventListener('message', (event) => {
  const d = event.data;
  if (!d || d.type !== 'SIMPAN' || !Array.isArray(d.urls)) return;
  const alamat = d.urls.filter((u) => typeof u === 'string' && u.startsWith('/') && !u.startsWith('//')).slice(0, 80);
  event.waitUntil(
    (async () => {
      let berhasil = 0;
      // Tiga sekaligus agar koneksi lambat tidak tersedak.
      for (let i = 0; i < alamat.length; i += 3) {
        const hasil = await Promise.all(
          alamat.slice(i, i + 3).map((a) => (a.startsWith('/api/') ? simpanData(a) : simpanHalaman(a)).catch(() => false)),
        );
        berhasil += hasil.filter(Boolean).length;
      }
      await Promise.all(SEMUA_CACHE.map((c) => pangkas(c, true)));
      for (const klien of await self.clients.matchAll({ type: 'window' })) {
        klien.postMessage({ type: 'SIAP', berhasil, total: alamat.length, kunci: d.kunci });
      }
    })(),
  );
});

// Membuat situs statis ke folder dist/ dari js/data.js. Tanpa dependensi, cukup Node 18+.
// Pakai: node build.js            (domain sendiri, situs di akar)
//        BASE_PATH=/nawaitu node build.js   (bila situs ada di subfolder, mis. GitHub Pages)
const fs = require('node:fs');
const path = require('node:path');
const DATA = require('./js/data.js');

const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
const DIST = path.join(__dirname, 'dist');
const { situs, kota, kajian, artikel } = DATA;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const hariIni = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // WIB
const kotaDari = (s) => kota.find((k) => k.slug === s);
const tglIndo = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

for (const e of kajian) {
  if (!kotaDari(e.kota)) throw new Error(`Kajian "${e.slug}": kota "${e.kota}" tidak ada di daftar kota`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.tanggal)) throw new Error(`Kajian "${e.slug}": tanggal harus YYYY-MM-DD`);
}

const akan = kajian
  .filter((e) => e.tanggal >= hariIni)
  .sort((a, b) => Number(!!b.unggulan) - Number(!!a.unggulan) || (a.tanggal + a.jam).localeCompare(b.tanggal + b.jam));

function tulis(rel, isi) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, isi);
}

// ---------- Data terstruktur (JSON-LD) ----------
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const abs = (u) => `${situs.url}${BASE}${u}`;
const SITUS_LD = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: situs.nama, url: abs('/'), inLanguage: 'id', description: situs.deskripsi },
  { '@context': 'https://schema.org', '@type': 'Organization', name: situs.nama, url: abs('/'), logo: abs('/img/icon-512.png'), slogan: situs.tagline },
];
// Remah roti (breadcrumb) dari alamat halaman, mis. /kajian/nama/ => Beranda > Kajian > judul.
function breadcrumb(url, judul) {
  const bagian = url.split('/').filter(Boolean);
  if (!bagian.length || url.endsWith('.html')) return null;
  const nama = { 'jadwal-sholat': 'Jadwal Shalat', kajian: 'Kajian', artikel: 'Artikel' };
  const item = [['Beranda', '/']];
  if (bagian.length > 1) item.push([nama[bagian[0]] || bagian[0], `/${bagian[0]}/`]);
  item.push([judul, url]);
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: item.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(u) })),
  };
}

// ---------- Kerangka halaman ----------
function halaman({ judul, deskripsi, url, isi, bodyAttr = '', fontArab = false, jsonld = [], noindex = false, ogType = 'website' }) {
  const penuh = `${situs.url}${BASE}${url}`;
  const menu = [['/', 'Beranda'], ['/jadwal-sholat/jakarta/', 'Jadwal Shalat'], ['/kajian/', 'Kajian'], ['/artikel/', 'Artikel']];
  const judulLengkap = judul === situs.nama ? `${situs.nama}: ${situs.tagline}` : `${judul} | ${situs.nama}`;
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(judulLengkap)}</title>
<meta name="description" content="${esc(deskripsi)}">
<link rel="canonical" href="${esc(penuh)}">
<meta property="og:title" content="${esc(judulLengkap)}">
<meta property="og:description" content="${esc(deskripsi)}">
<meta property="og:url" content="${esc(penuh)}">
<meta property="og:locale" content="id_ID">
<meta property="og:site_name" content="${esc(situs.nama)}">
<meta property="og:type" content="${ogType}">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="500">
<meta property="og:image:alt" content="${esc(situs.nama)}: ${esc(situs.tagline)}">
<meta name="application-name" content="${esc(situs.nama)}">${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta property="og:image" content="${esc(situs.url + BASE)}/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0e3b2e">
<link rel="icon" href="${BASE}/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="32x32" href="${BASE}/img/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="${BASE}/img/favicon-16.png">
<link rel="apple-touch-icon" href="${BASE}/img/apple-touch-icon.png">
<link rel="manifest" href="${BASE}/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="${BASE}/css/style.css">${fontArab ? '\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri&display=swap">' : ''}${[...jsonld, breadcrumb(url, judul)].filter(Boolean).map((o) => `\n<script type="application/ld+json">${ld(o)}</script>`).join('')}
</head>
<body data-base="${BASE}" ${bodyAttr}>
<header class="top"><div class="wrap">
  <a class="logo" href="${BASE}/"><img src="${BASE}/img/logo.png" alt="" width="22" height="28">${esc(situs.nama)}</a>
  <nav aria-label="Menu utama">${menu.map(([h, n]) => `<a href="${BASE}${h}"${h === url ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
</div></header>
${isi}
<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(situs.nama)}. Jadwal shalat dihitung di perangkat Anda dan bisa berbeda 1 sampai 3 menit dari jadwal resmi Kemenag RI.</div></footer>
<script src="${BASE}/js/data.js"></script>
<script src="${BASE}/js/shalat.js"></script>
<script src="${BASE}/js/app.js"></script>
</body>
</html>
`;
}

const hero = (beranda) => `<section class="hero"><div class="wrap hero-grid">
  <div class="hero-kiri">
    ${beranda ? `<h1 class="brand">${esc(situs.nama)}</h1><p class="tagline">${esc(situs.tagline)}</p>` : ''}
    <div class="label">Waktu shalat berikutnya</div>
    <div class="nama-next" id="nama-next">…</div>
    <div class="sub" id="tanggal"></div>
    <p class="pilih-kota"><label for="kota">Kota</label><select id="kota"></select></p>
  </div>
  <div class="kartu-hitung">
    <div class="label">Tersisa</div>
    <div class="count" id="hitung">--:--:--</div>
    <div class="progres" aria-hidden="true"><span id="progres"></span></div>
    <div class="progres-ket"><span id="prog-kiri"></span><span id="prog-kanan"></span></div>
    <div class="sub" id="jam-next"></div>
  </div>
</div></section>
<noscript><div class="wrap catatan">Aktifkan JavaScript untuk melihat jadwal shalat hari ini.</div></noscript>`;

const cta = `<div class="cta"><div><strong>Ibadah lebih tertata dengan aplikasi ${esc(situs.nama)} (Android)</strong>
  <ul><li>Pengingat adzan</li><li>Tracker shalat</li><li>Puasa</li><li>Zakat</li><li>Dzikir</li></ul></div>${
  situs.playStore ? `<a class="tombol" href="${esc(situs.playStore)}" rel="noopener">Unduh di Google Play</a>` : ''}</div>`;

const kartuKajian = (e) => {
  const k = kotaDari(e.kota);
  return `<a class="card" href="${BASE}/kajian/${e.slug}/" data-tanggal="${e.tanggal}" data-kota="${e.kota}">
  ${e.contoh ? '<span class="tag contoh">Contoh</span>' : ''}<h3>${esc(e.judul)}</h3>
  <div>${esc(e.pemateri)}</div><div class="muted">${tglIndo(e.tanggal)} · ${e.jam} ${k.zona}</div><div class="muted">${esc(e.tempat)}</div></a>`;
};
const kartuArtikel = (a) => `<a class="card" href="${BASE}/artikel/${a.slug}/"><h3>${esc(a.judul)}</h3><div class="muted">${esc(a.ringkas)}</div></a>`;

// ---------- Halaman ----------
tulis('index.html', halaman({
  judul: situs.nama, url: '/', bodyAttr: 'data-mode="beranda"', jsonld: SITUS_LD,
  deskripsi: situs.deskripsi,
  isi: `${hero(true)}<main class="wrap">
  <h2>Jadwal hari ini</h2><div class="waktu" id="waktu-hari"></div>
  <p class="muted lanjut"><a href="${BASE}/jadwal-sholat/jakarta/">Lihat jadwal 7 hari →</a></p>
  <div class="menu-cepat">
    <a href="${BASE}/jadwal-sholat/jakarta/"><b>Jadwal Shalat</b><span>${kota.length} kota, 7 hari ke depan, dihitung di perangkat Anda.</span></a>
    <a href="${BASE}/kajian/"><b>Kajian</b><span>Temukan kajian islami terdekat: pemateri, waktu, dan lokasi.</span></a>
    <a href="${BASE}/artikel/"><b>Artikel</b><span>Niat, tata cara, dan doa ibadah sehari-hari secara ringkas.</span></a>
  </div>
  <h2>Pilih kota</h2>
  <div class="chips kota-list">${kota.map((x) => `<a class="chip" href="${BASE}/jadwal-sholat/${x.slug}/">${esc(x.nama)}</a>`).join('')}</div>
  <h2>Kajian terdekat</h2>
  <div class="grid">${akan.slice(0, 3).map(kartuKajian).join('') || '<p class="muted">Belum ada kajian terjadwal.</p>'}</div>
  <h2>Artikel</h2><div class="grid">${artikel.map(kartuArtikel).join('')}</div>${cta}</main>`,
}));

for (const k of kota) {
  tulis(`jadwal-sholat/${k.slug}/index.html`, halaman({
    judul: `Jadwal Shalat ${k.nama} Hari Ini`, url: `/jadwal-sholat/${k.slug}/`,
    bodyAttr: `data-mode="kota" data-kota="${k.slug}"`,
    deskripsi: `Jadwal shalat (sholat) ${k.nama} hari ini dan 7 hari ke depan: Subuh, Dzuhur, Ashar, Maghrib, Isya (${k.zona}), mengikuti pola Kemenag RI. Pengingat adzan ada di aplikasi ${situs.nama}.`,
    isi: `${hero(false)}<main class="wrap">
  <h1>Jadwal Shalat ${esc(k.nama)}</h1>
  <div class="waktu" id="waktu-hari"></div>
  <h2>7 hari ke depan</h2>
  <div class="scroll-x"><table id="tabel7"><thead><tr><th>Tanggal</th>${['Subuh', 'Terbit', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((n) => `<th>${n}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
  <div class="catatan"><b>Metode:</b> Subuh 20°, Isya 18°, Ashar bayangan 1x, ihtiyati +2 menit, mengikuti pola Kemenag RI, dihitung dari koordinat pusat kota. Untuk waktu yang dipakai masjid setempat, ikuti jadwal masjid.</div>
  <p class="muted">Kota lain: ${kota.filter((x) => x !== k).map((x) => `<a href="${BASE}/jadwal-sholat/${x.slug}/">${esc(x.nama)}</a>`).join(' · ')}</p>${cta}</main>`,
  }));
}

tulis('kajian/index.html', halaman({
  judul: 'Jadwal Kajian', url: '/kajian/', bodyAttr: 'data-mode="kajian"',
  deskripsi: `Jadwal kajian islami terbaru di berbagai kota di Indonesia: pemateri, tanggal, dan lokasi. Pengingat kajian ada di aplikasi ${situs.nama}.`,
  isi: `<main class="wrap"><h1>Jadwal Kajian</h1>
  <div class="chips" role="group" aria-label="Filter kota"><button class="chip" type="button" data-f="semua" aria-pressed="true">Semua</button>${
    [...new Set(akan.map((e) => e.kota))].map((s) => `<button class="chip" type="button" data-f="${s}" aria-pressed="false">${esc(kotaDari(s).nama)}</button>`).join('')}</div>
  <div class="grid">${akan.map(kartuKajian).join('') || '<p class="muted">Belum ada kajian terjadwal.</p>'}</div>${cta}</main>`,
}));

for (const e of akan) {
  const k = kotaDari(e.kota);
  tulis(`kajian/${e.slug}/index.html`, halaman({
    judul: e.judul, url: `/kajian/${e.slug}/`,
    deskripsi: `${e.pemateri}, ${tglIndo(e.tanggal)} pukul ${e.jam} ${k.zona}, ${e.tempat}.`,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Event', name: e.judul,
      startDate: `${e.tanggal}T${e.jam}:00+0${k.tz}:00`,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      description: e.ket,
      performer: { '@type': 'Person', name: e.pemateri },
      location: { '@type': 'Place', name: e.tempat, address: { '@type': 'PostalAddress', addressLocality: k.nama, addressCountry: 'ID' } },
      organizer: { '@type': 'Organization', name: situs.nama, url: abs('/') },
    }],
    isi: `<main class="wrap baca"><p><a href="${BASE}/kajian/">← Semua kajian</a></p>
  ${e.contoh ? '<span class="tag contoh">Contoh</span>' : ''}<h1>${esc(e.judul)}</h1>
  <p><b>${esc(e.pemateri)}</b></p><p>${tglIndo(e.tanggal)} · ${e.jam} ${k.zona}</p><p>${esc(e.tempat)}, ${esc(k.nama)}</p><p>${esc(e.ket)}</p>${cta}</main>`,
  }));
}

tulis('artikel/index.html', halaman({
  judul: 'Artikel', url: '/artikel/', deskripsi: `Artikel ringkas seputar ibadah sehari-hari: niat, tata cara, dan doa. Teman ibadah harian Anda di ${situs.nama}.`,
  isi: `<main class="wrap"><h1>Artikel</h1><div class="grid">${artikel.map(kartuArtikel).join('')}</div>${cta}</main>`,
}));

for (const a of artikel) {
  tulis(`artikel/${a.slug}/index.html`, halaman({
    judul: a.judul, url: `/artikel/${a.slug}/`, deskripsi: a.ringkas, fontArab: true, ogType: 'article',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Article', headline: a.judul, description: a.ringkas, inLanguage: 'id',
      mainEntityOfPage: abs(`/artikel/${a.slug}/`), image: abs('/img/og-image.png'),
      publisher: { '@type': 'Organization', name: situs.nama, logo: { '@type': 'ImageObject', url: abs('/img/icon-512.png') } },
    }],
    isi: `<main class="wrap baca"><p><a href="${BASE}/artikel/">← Semua artikel</a></p><h1>${esc(a.judul)}</h1>${a.isi}${cta}</main>`,
  }));
}

tulis('404.html', halaman({
  judul: 'Halaman tidak ditemukan', url: '/404.html', deskripsi: 'Halaman tidak ditemukan.', noindex: true,
  isi: `<main class="wrap"><h1>Halaman tidak ditemukan</h1><p><a href="${BASE}/">Kembali ke beranda</a></p></main>`,
}));

// ---------- SEO & aset ----------
const urls = ['/', '/kajian/', '/artikel/', ...kota.map((k) => `/jadwal-sholat/${k.slug}/`),
  ...akan.map((e) => `/kajian/${e.slug}/`), ...artikel.map((a) => `/artikel/${a.slug}/`)];
tulis('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
  urls.map((u) => `  <url><loc>${situs.url}${BASE}${u}</loc><lastmod>${hariIni}</lastmod></url>`).join('\n')}\n</urlset>\n`);
tulis('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${situs.url}${BASE}/sitemap.xml\n`);
tulis('site.webmanifest', JSON.stringify({
  name: `${situs.nama}: ${situs.tagline}`, short_name: situs.nama, description: situs.deskripsi, lang: 'id', start_url: `${BASE}/`, display: 'standalone',
  background_color: '#0e3b2e', theme_color: '#0e3b2e',
  icons: [
    { src: `${BASE}/img/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${BASE}/img/icon-512.png`, sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));
const aset = ['css/style.css', 'js/data.js', 'js/shalat.js', 'js/app.js', 'favicon.ico',
  ...fs.readdirSync(path.join(__dirname, 'img')).map((n) => `img/${n}`)];
for (const f of aset) tulis(f, fs.readFileSync(path.join(__dirname, f)));
console.log(`Selesai: ${urls.length + 1} halaman di dist/`);

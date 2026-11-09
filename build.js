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

// ---------- Kerangka halaman ----------
function halaman({ judul, deskripsi, url, isi, bodyAttr = '', fontArab = false, jsonld = '' }) {
  const penuh = `${situs.url}${BASE}${url}`;
  const menu = [['/', 'Beranda'], ['/jadwal-sholat/jakarta/', 'Jadwal Sholat'], ['/kajian/', 'Kajian'], ['/artikel/', 'Artikel']];
  const judulLengkap = judul === situs.nama ? `${situs.nama}: Teman Ibadah Harian` : `${judul} | ${situs.nama}`;
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
<link rel="stylesheet" href="${BASE}/css/style.css">${fontArab ? '\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri&display=swap">' : ''}${jsonld ? `\n<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body data-base="${BASE}" ${bodyAttr}>
<header class="top"><div class="wrap">
  <a class="logo" href="${BASE}/">${esc(situs.nama)}</a>
  <nav aria-label="Menu utama">${menu.map(([h, n]) => `<a href="${BASE}${h}"${h === url ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
</div></header>
${isi}
<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(situs.nama)}. Jadwal sholat dihitung di perangkat Anda dan bisa berbeda 1 sampai 3 menit dari jadwal resmi Kemenag RI.</div></footer>
<script src="${BASE}/js/data.js"></script>
<script src="${BASE}/js/shalat.js"></script>
<script src="${BASE}/js/app.js"></script>
</body>
</html>
`;
}

const hero = `<section class="hero"><div class="wrap">
  <div>
    <div class="label">Waktu sholat berikutnya</div>
    <div class="nama-next" id="nama-next">…</div>
    <div class="sub" id="tanggal"></div>
    <p><label for="kota" class="sub">Kota </label><select id="kota"></select></p>
  </div>
  <div>
    <div class="label">Tersisa</div>
    <div class="count" id="hitung">--:--:--</div>
    <div class="sub" id="jam-next"></div>
  </div>
</div></section>
<noscript><div class="wrap catatan">Aktifkan JavaScript untuk melihat jadwal sholat hari ini.</div></noscript>`;

const cta = `<div class="cta"><strong>Pengingat adzan, tracker sholat, dan fitur ibadah lainnya ada di aplikasi ${esc(situs.nama)} (Android).</strong>${
  situs.playStore ? `<p><a href="${esc(situs.playStore)}" rel="noopener">Unduh di Google Play</a></p>` : ''}</div>`;

const kartuKajian = (e) => {
  const k = kotaDari(e.kota);
  return `<a class="card" href="${BASE}/kajian/${e.slug}/" data-tanggal="${e.tanggal}" data-kota="${e.kota}">
  ${e.contoh ? '<span class="tag contoh">Contoh</span>' : ''}<h3>${esc(e.judul)}</h3>
  <div>${esc(e.pemateri)}</div><div class="muted">${tglIndo(e.tanggal)} · ${e.jam} ${k.zona}</div><div class="muted">${esc(e.tempat)}</div></a>`;
};
const kartuArtikel = (a) => `<a class="card" href="${BASE}/artikel/${a.slug}/"><h3>${esc(a.judul)}</h3><div class="muted">${esc(a.ringkas)}</div></a>`;

// ---------- Halaman ----------
tulis('index.html', halaman({
  judul: situs.nama, url: '/', bodyAttr: 'data-mode="beranda"',
  deskripsi: 'Jadwal sholat per kota, kajian islami, dan artikel. Teman ibadah harian Anda.',
  isi: `${hero}<main class="wrap">
  <h2>Jadwal hari ini</h2><div class="waktu" id="waktu-hari"></div>
  <p class="muted"><a href="${BASE}/jadwal-sholat/jakarta/">Jadwal 7 hari per kota</a></p>
  <h2>Kajian terdekat</h2>
  <div class="grid">${akan.slice(0, 3).map(kartuKajian).join('') || '<p class="muted">Belum ada kajian terjadwal.</p>'}</div>
  <h2>Artikel</h2><div class="grid">${artikel.map(kartuArtikel).join('')}</div>${cta}</main>`,
}));

for (const k of kota) {
  tulis(`jadwal-sholat/${k.slug}/index.html`, halaman({
    judul: `Jadwal Sholat ${k.nama} Hari Ini`, url: `/jadwal-sholat/${k.slug}/`,
    bodyAttr: `data-mode="kota" data-kota="${k.slug}"`,
    deskripsi: `Jadwal sholat ${k.nama} hari ini dan 7 hari ke depan: Subuh, Dzuhur, Ashar, Maghrib, Isya (${k.zona}).`,
    isi: `${hero}<main class="wrap">
  <h1>Jadwal Sholat ${esc(k.nama)}</h1>
  <div class="waktu" id="waktu-hari"></div>
  <h2>7 hari ke depan</h2>
  <div class="scroll-x"><table id="tabel7"><thead><tr><th>Tanggal</th>${['Subuh', 'Terbit', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((n) => `<th>${n}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
  <div class="catatan"><b>Metode:</b> Subuh 20°, Isya 18°, Ashar bayangan 1x, ihtiyati +2 menit, mengikuti pola Kemenag RI, dihitung dari koordinat pusat kota. Untuk waktu yang dipakai masjid setempat, ikuti jadwal masjid.</div>
  <p class="muted">Kota lain: ${kota.filter((x) => x !== k).map((x) => `<a href="${BASE}/jadwal-sholat/${x.slug}/">${esc(x.nama)}</a>`).join(' · ')}</p>${cta}</main>`,
  }));
}

tulis('kajian/index.html', halaman({
  judul: 'Jadwal Kajian', url: '/kajian/', bodyAttr: 'data-mode="kajian"',
  deskripsi: 'Daftar kajian islami terbaru di berbagai kota di Indonesia.',
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
    jsonld: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Event', name: e.judul,
      startDate: `${e.tanggal}T${e.jam}:00+0${k.tz}:00`,
      performer: { '@type': 'Person', name: e.pemateri },
      location: { '@type': 'Place', name: e.tempat, address: k.nama },
    }).replace(/</g, '\\u003c'),
    isi: `<main class="wrap baca"><p><a href="${BASE}/kajian/">← Semua kajian</a></p>
  ${e.contoh ? '<span class="tag contoh">Contoh</span>' : ''}<h1>${esc(e.judul)}</h1>
  <p><b>${esc(e.pemateri)}</b></p><p>${tglIndo(e.tanggal)} · ${e.jam} ${k.zona}</p><p>${esc(e.tempat)}, ${esc(k.nama)}</p><p>${esc(e.ket)}</p>${cta}</main>`,
  }));
}

tulis('artikel/index.html', halaman({
  judul: 'Artikel', url: '/artikel/', deskripsi: 'Artikel ringkas seputar ibadah sehari-hari.',
  isi: `<main class="wrap"><h1>Artikel</h1><div class="grid">${artikel.map(kartuArtikel).join('')}</div>${cta}</main>`,
}));

for (const a of artikel) {
  tulis(`artikel/${a.slug}/index.html`, halaman({
    judul: a.judul, url: `/artikel/${a.slug}/`, deskripsi: a.ringkas, fontArab: true,
    isi: `<main class="wrap baca"><p><a href="${BASE}/artikel/">← Semua artikel</a></p><h1>${esc(a.judul)}</h1>${a.isi}${cta}</main>`,
  }));
}

tulis('404.html', halaman({
  judul: 'Halaman tidak ditemukan', url: '/404.html', deskripsi: 'Halaman tidak ditemukan.',
  isi: `<main class="wrap"><h1>Halaman tidak ditemukan</h1><p><a href="${BASE}/">Kembali ke beranda</a></p></main>`,
}));

// ---------- SEO & aset ----------
const urls = ['/', '/kajian/', '/artikel/', ...kota.map((k) => `/jadwal-sholat/${k.slug}/`),
  ...akan.map((e) => `/kajian/${e.slug}/`), ...artikel.map((a) => `/artikel/${a.slug}/`)];
tulis('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
  urls.map((u) => `  <url><loc>${situs.url}${BASE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
tulis('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${situs.url}${BASE}/sitemap.xml\n`);
for (const f of ['css/style.css', 'js/data.js', 'js/shalat.js', 'js/app.js']) {
  tulis(f, fs.readFileSync(path.join(__dirname, f)));
}
console.log(`Selesai: ${urls.length + 1} halaman di dist/`);
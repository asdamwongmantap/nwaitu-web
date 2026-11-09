// Masjid/mushalla dan sekolah Islam di sekitar sebuah titik, dari OpenStreetMap
// (data terbuka, ODbL). Logikanya mengikuti aplikasi Nawaitu
// (lib/features/kajian/kajian_data.dart): beberapa server Overpass dicoba
// bergantian, lalu Photon sebagai cadangan bila semuanya sibuk.
import 'server-only';
import { after } from 'next/server';
import { MASA_BERLAKU, arsipBanyak, bacaBanyak } from './arsip';

export type JenisCari = 'masjid' | 'sekolah';
export type Tempat = { id: string; nama: string; jenis: string; lat: number; lng: number; alamat: string | null };

type Elemen = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

const CERMIN = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const AGEN = { 'User-Agent': 'Nawaitu-Web/2.0 (masjid dan sekolah islam terdekat)' };
const JEDA_CERMIN = 5000;

export const NAMA_MASJID_KOSONG = 'Masjid / mushalla (belum bernama di peta)';

export function jarakKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

// ---------- Overpass ----------

/** Satu permintaan. Respons dengan `remark` galat (mis. kehabisan waktu) dianggap gagal, bukan "kosong". */
async function tanyaOverpass(url: string, q: string, signal: AbortSignal) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...AGEN, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: q }),
    cache: 'no-store',
    signal,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const m = (await r.json()) as { elements?: Elemen[]; remark?: string };
  const catatan = String(m.remark ?? '').toLowerCase();
  if (!Array.isArray(m.elements)) throw new Error('Respons Overpass tidak valid');
  if (catatan.includes('error') || catatan.includes('timed out') || (!m.elements.length && catatan)) {
    throw new Error(`Overpass: ${m.remark}`);
  }
  return m.elements;
}

/** Server berikutnya mulai dicoba setiap beberapa detik; jawaban valid pertama yang dipakai. */
async function overpassBalapan(q: string): Promise<Elemen[]> {
  const henti = new AbortController();
  const tugas = CERMIN.map(
    (url, i) =>
      new Promise<Elemen[]>((ok, gagal) => {
        setTimeout(() => {
          if (henti.signal.aborted) return gagal(new Error('dibatalkan'));
          tanyaOverpass(url, q, AbortSignal.any([henti.signal, AbortSignal.timeout(45000)])).then(ok, gagal);
        }, i * JEDA_CERMIN);
      }),
  );
  try {
    return await Promise.any(tugas);
  } catch {
    throw new Error('Semua server peta sedang sibuk');
  } finally {
    henti.abort();
  }
}

// Nama sekolah Islam umum di Indonesia; singkatan dicocokkan sebagai kata utuh.
const POLA_SEKOLAH =
  /pesantren|pondok|madrasah|islam|muhammadiyah|ma.arif|nahdlatul|tahfidz|raudhatul|(^| )(mi|mis|min|mts|mtsn|mtss|ma|man|mas|ra|tpa|tpq|sdit|smpit|smait|sdi|smpi|smai)( |$)/i;

const sekolahIslam = (nama: string, t: Record<string, string>) => t.religion === 'muslim' || POLA_SEKOLAH.test(nama);

/** Satu kueri untuk gabungan beberapa petak (kotak s,w,n,e). Tanpa batas jumlah karena petaknya kecil. */
function kueri(jenis: JenisCari, kotak: Kotak[]) {
  // Masjid: tag persis. Sekolah: ambil semua sekolah dengan filter tag persis (ringan bagi
  // server), lalu saring yang Islami di sini; regex nama di Overpass terlalu berat.
  const filter =
    jenis === 'masjid' ? ['["amenity"="place_of_worship"]["religion"="muslim"]'] : ['school', 'kindergarten', 'college', 'university'].map((t) => `["amenity"="${t}"]`);
  const bagian = kotak.flatMap(([s, w, n, e]) => filter.map((f) => `nwr${f}(${s},${w},${n},${e});`));
  return `[out:json][timeout:40];(${bagian.join('')});out center;`;
}

function jenisMasjid(nama: string, t: Record<string, string>) {
  if (/mushal|musal|mushol|musol|langgar|surau/i.test(nama)) return 'Mushalla';
  if (/masjid|mesjid/i.test(nama) || t.building === 'mosque') return 'Masjid';
  return 'Masjid / mushalla';
}

function jenisSekolah(nama: string, t: Record<string, string>) {
  if (/pesantren|pondok/i.test(nama)) return 'Pesantren';
  if (t.amenity === 'university' || t.amenity === 'college') return 'Perguruan tinggi';
  if (t.amenity === 'kindergarten' || /(^| )(ra|tk|tpa|tpq|paud)( |$)|raudhatul/i.test(nama)) return 'TK / RA / TPA';
  if (/madrasah|(^| )(mi|mis|min|mts|mtsn|mtss|ma|man|mas)( |$)/i.test(nama)) return 'Madrasah';
  return 'Sekolah Islam';
}

function urai(elemen: Elemen[], jenis: JenisCari): Tempat[] {
  const hasil: Tempat[] = [];
  for (const e of elemen) {
    const t = e.tags ?? {};
    const la = e.lat ?? e.center?.lat;
    const ln = e.lon ?? e.center?.lon;
    if (la == null || ln == null) continue;
    const namaAsli = t.name ?? t['name:id'] ?? t.official_name ?? t.alt_name;
    if (jenis === 'sekolah' && (!namaAsli || !sekolahIslam(namaAsli, t))) continue;
    const nama = namaAsli ?? NAMA_MASJID_KOSONG;
    const jalan = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
    hasil.push({
      id: `${e.type}/${e.id}`,
      nama,
      jenis: jenis === 'masjid' ? jenisMasjid(nama, t) : jenisSekolah(nama, t),
      lat: la,
      lng: ln,
      alamat: t['addr:full'] ?? (jalan || null),
    });
  }
  return hasil;
}

// ---------- Arsip per petak ----------
//
// Peta dibagi menjadi petak tetap UKURAN_PETAK derajat (±2,8 km). Isi tiap petak
// (sudah disaring: hanya masjid / sekolah Islam) disimpan di
// data/tempat/<jenis>/<petak>.json dan dipakai bersama semua pengunjung di
// sekitarnya. Petak yang belum ada atau kedaluwarsa diambil dalam SATU kueri
// Overpass gabungan, dan hanya petak itu saja, bukan seluruh radius.

const UKURAN_PETAK = 0.025;

type Kotak = [number, number, number, number]; // selatan, barat, utara, timur
type Petak = { i: number; j: number };

const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const kotakPetak = ({ i, j }: Petak): Kotak => [r4(i * UKURAN_PETAK), r4(j * UKURAN_PETAK), r4((i + 1) * UKURAN_PETAK), r4((j + 1) * UKURAN_PETAK)];
const berkasPetak = (jenis: JenisCari, p: Petak) => `tempat/${jenis}/${p.i}_${p.j}.json`;

/** Petak yang bersinggungan dengan lingkaran [km] di sekitar titik. */
function petakDalam(lat: number, lng: number, km: number): Petak[] {
  const dLat = km / 111;
  const dLng = km / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const hasil: Petak[] = [];
  for (let i = Math.floor((lat - dLat) / UKURAN_PETAK); i <= Math.floor((lat + dLat) / UKURAN_PETAK); i++) {
    for (let j = Math.floor((lng - dLng) / UKURAN_PETAK); j <= Math.floor((lng + dLng) / UKURAN_PETAK); j++) {
      // Lewati petak di pojok yang seluruhnya di luar lingkaran.
      const la = Math.min(Math.max(lat, i * UKURAN_PETAK), (i + 1) * UKURAN_PETAK);
      const ln = Math.min(Math.max(lng, j * UKURAN_PETAK), (j + 1) * UKURAN_PETAK);
      if (jarakKm(lat, lng, la, ln) <= km) hasil.push({ i, j });
    }
  }
  return hasil;
}

/** Isi petak-petak: dari arsip bila ada, sisanya lewat satu kueri Overpass lalu dibagi per petak. */
async function muatPetak(jenis: JenisCari, rel: string[]) {
  const { isi } = await arsipBanyak<Tempat[]>(rel, {
    masa: MASA_BERLAKU.tempat,
    ambil: async (kurang) => {
      const petak = kurang.map(petakDariBerkas);
      const tempat = urai(await overpassBalapan(kueri(jenis, petak.map(kotakPetak))), jenis);
      const per = new Map<string, Tempat[]>(kurang.map((r) => [r, []]));
      for (const t of tempat) {
        const r = berkasPetak(jenis, { i: Math.floor(t.lat / UKURAN_PETAK), j: Math.floor(t.lng / UKURAN_PETAK) });
        per.get(r)?.push(t); // di luar petak yang diminta (mis. tepat di garis batas): abaikan
      }
      return per;
    },
  });
  return isi;
}

const petakDariBerkas = (rel: string): Petak => {
  const [i, j] = rel.slice(rel.lastIndexOf('/') + 1, -5).split('_').map(Number);
  return { i, j };
};

/** Petak yang sedang diambil di latar belakang, supaya tidak dikueri dua kali. */
const latar = new Set<string>();

/** Ambil petak yang kurang setelah respons terkirim; pengunjung berikutnya mendapat data lengkap. */
function lengkapiNanti(jenis: JenisCari, rel: string[]) {
  const baru = rel.filter((r) => !latar.has(r));
  if (!baru.length) return;
  baru.forEach((r) => latar.add(r));
  after(() => muatPetak(jenis, baru).catch(() => {}).finally(() => baru.forEach((r) => latar.delete(r))));
}

/**
 * Cari di radius kecil dulu; radius lebih besar hanya bila hasilnya sedikit.
 * Overpass hanya ditunggu bila petak pengunjung sendiri belum ada atau hasil
 * arsip belum cukup; petak lain yang kurang dilengkapi di latar belakang.
 */
async function sekitarArsip(jenis: JenisCari, lat: number, lng: number): Promise<Tempat[]> {
  const radius = jenis === 'masjid' ? [2.5, 6] : [3, 8];
  const minimal = jenis === 'masjid' ? 5 : 3;
  const petakSaya = berkasPetak(jenis, { i: Math.floor(lat / UKURAN_PETAK), j: Math.floor(lng / UKURAN_PETAK) });
  const sudah = new Set<string>();
  const unik = new Map<string, Tempat>();
  let ada = 0;
  let dekat: Tempat[] = [];
  const hitungDekat = (km: number) => [...unik.values()].filter((t) => jarakKm(lat, lng, t.lat, t.lng) <= km);
  for (const km of radius) {
    const rel = petakDalam(lat, lng, km).map((p) => berkasPetak(jenis, p)).filter((r) => !sudah.has(r));
    rel.forEach((r) => sudah.add(r));
    const baca = await bacaBanyak<Tempat[]>(rel, MASA_BERLAKU.tempat);
    for (const [r, t] of [...baca.lama, ...baca.isi]) {
      ada += Number(baca.isi.has(r) || baca.lama.has(r));
      t.forEach((x) => unik.set(x.id, x));
    }
    dekat = hitungDekat(km);
    if (baca.kurang.length) {
      if (!baca.kurang.includes(petakSaya) && dekat.length >= minimal) lengkapiNanti(jenis, baca.kurang);
      else {
        const isi = await muatPetak(jenis, baca.kurang);
        ada += isi.size;
        isi.forEach((t) => t.forEach((x) => unik.set(x.id, x)));
        dekat = hitungDekat(km);
      }
    }
    if (dekat.length >= minimal) break;
  }
  if (!ada) throw new Error('Semua server peta sedang sibuk');
  return dekat;
}

// ---------- Photon (cadangan) ----------

async function photon(q: string, tag: string, lat: number, lng: number): Promise<Tempat[]> {
  const u = new URL('https://photon.komoot.io/api/');
  Object.entries({ q, lat: String(lat), lon: String(lng), limit: '50', osm_tag: tag }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: AGEN, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Photon HTTP ${r.status}`);
  const m = (await r.json()) as {
    features?: { geometry?: { coordinates?: number[] }; properties?: { name?: string; osm_type?: string; osm_id?: number; street?: string } }[];
  };
  return (m.features ?? []).flatMap((f) => {
    const [ln, la] = f.geometry?.coordinates ?? [];
    const nama = f.properties?.name;
    if (!nama || la == null || ln == null || jarakKm(lat, lng, la, ln) > 12) return [];
    const tipe = { N: 'node', W: 'way', R: 'relation' }[f.properties?.osm_type ?? ''] ?? 'node';
    return [{ id: `${tipe}/${f.properties?.osm_id}`, nama, jenis: '', lat: la, lng: ln, alamat: f.properties?.street ?? null }];
  });
}

async function sekitarPhoton(jenis: JenisCari, lat: number, lng: number): Promise<Tempat[]> {
  if (jenis === 'masjid') {
    return (await photon('masjid', 'amenity:place_of_worship', lat, lng)).map((t) => ({ ...t, jenis: jenisMasjid(t.nama, {}) }));
  }
  const semua = await Promise.allSettled(['pondok pesantren', 'madrasah', 'sekolah islam'].map((q) => photon(q, 'amenity:school', lat, lng)));
  const unik = new Map<string, Tempat>();
  for (const s of semua) if (s.status === 'fulfilled') for (const t of s.value) unik.set(t.id, t);
  return [...unik.values()].filter((t) => POLA_SEKOLAH.test(t.nama)).map((t) => ({ ...t, jenis: jenisSekolah(t.nama, {}) }));
}

/**
 * Tempat di sekitar titik, diurutkan dari yang terdekat. Titik dibulatkan ±1 km; ke
 * Overpass hanya dikirim batas petak, bukan lokasi pengunjung (Photon cadangan
 * masih menerima titik yang dibulatkan).
 */
export async function cariSekitar(jenis: JenisCari, lat: number, lng: number) {
  const la = Math.round(lat * 100) / 100;
  const ln = Math.round(lng * 100) / 100;
  let tempat: Tempat[];
  let sumber: 'overpass' | 'photon' = 'overpass';
  try {
    tempat = await sekitarArsip(jenis, la, ln);
  } catch {
    tempat = await sekitarPhoton(jenis, la, ln);
    sumber = 'photon';
  }
  tempat.sort((a, b) => jarakKm(la, ln, a.lat, a.lng) - jarakKm(la, ln, b.lat, b.lng));
  return { tempat: tempat.slice(0, 80), sumber };
}

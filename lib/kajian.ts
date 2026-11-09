// Jadwal kajian dari repositori data yang sama dengan aplikasi Nawaitu
// (diperbarui otomatis dua kali sehari).
import 'server-only';
import { cocokkanWilayah, daftarWilayah, jadwalWilayah, slugify, type Wilayah } from './jadwal';
import type { JadwalAcuan, Kajian } from './kajian-util';
import { isoTanggal, jamDinding, tambahHari } from './waktu';

export const URL_KAJIAN =
  'https://raw.githubusercontent.com/asdamwongmantap/jadwal-kajian-indonesia-json/master/data/kajian.json';
export const REPO_KAJIAN = 'https://github.com/asdamwongmantap/jadwal-kajian-indonesia-json';

const NOMOR_HARI: Record<string, number> = {
  ahad: 0, minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, jumah: 5, sabtu: 6,
};

type Mentah = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const teks = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Satu entri sumber; entri yang tidak lengkap dilewati agar satu baris rusak tidak menggagalkan daftar. */
function dariJson(m: Mentah): Omit<Kajian, 'jadwalSlug'> | null {
  try {
    const w = m.waktu ?? {};
    const tempat = m.tempat ?? {};
    const wil = m.wilayah ?? null;
    const tanggal = typeof m.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.tanggal) ? m.tanggal : null;
    const hari = NOMOR_HARI[String(m.hari ?? '').toLowerCase().replace(/'/g, '').trim()];
    const jam = teks(w.mulai);
    if (jam && !/^\d{1,2}:\d{2}$/.test(jam)) return null;
    if (!tanggal && hari === undefined) return null;
    const judul = teks(m.judul), tema = teks(m.tema), kitab = teks(m.kitab);
    const tampil = judul ?? tema ?? (kitab ? `Kajian Kitab ${kitab}` : 'Kajian');
    const zonaMentah = String(m.zona_waktu ?? wil?.zona_waktu ?? 'WIB').toUpperCase();
    const zona = (['WIB', 'WITA', 'WIT'].includes(zonaMentah) ? zonaMentah : 'WIB') as Kajian['zona'];
    const id = String(m.id);
    return {
      id,
      slug: `${slugify(tampil).slice(0, 60).replace(/-$/, '')}-${id}`,
      judul: tampil,
      subJudul: judul && tema ? tema : kitab && tampil !== `Kajian Kitab ${kitab}` ? `Kitab ${kitab}` : null,
      ustadz: Array.isArray(m.ustadz) ? m.ustadz.map(String) : [],
      tanggal,
      tanggalPerkiraan: m.tanggal_perkiraan === true,
      hari: !tanggal && hari !== undefined ? [hari] : [],
      rutin: teks(m.rutin),
      jam: jam ? jam.padStart(5, '0') : null,
      jamSelesai: teks(w.selesai),
      acuan: teks(w.acuan_shalat),
      zona,
      tempat: teks(tempat.nama) ?? 'Tempat belum disebut',
      alamat: teks(tempat.alamat),
      peta: teks(tempat.peta),
      wilayah: teks(wil?.slug),
      kabkota: teks(wil?.kabkota),
      provinsi: teks(wil?.provinsi),
      mode: ['online', 'hybrid'].includes(m.mode) ? m.mode : 'offline',
      streaming: teks(m.streaming),
      peserta: teks(m.peserta),
      sumber: (Array.isArray(m.sumber) ? m.sumber : [])
        .filter((s: Mentah) => typeof s?.url === 'string')
        .map((s: Mentah) => ({ nama: teks(s.nama) ?? 'Sumber', url: s.url })),
    };
  } catch {
    return null;
  }
}

const intiProvinsi = (p: string) =>
  p.toLowerCase().replace('daerah khusus ibukota', 'dki').replace('daerah istimewa', 'di').replace(/[^a-z]/g, '');

/** Wilayah jadwal shalat untuk kab/kota kajian; utamakan yang provinsinya sama. */
function wilayahJadwal(kabkota: string, provinsi: string | null, semua: Wilayah[]) {
  if (provinsi) {
    const p = intiProvinsi(provinsi);
    const satuProv = semua.filter((w) => intiProvinsi(w.provinsi) === p);
    const cocok = satuProv.length ? cocokkanWilayah(kabkota, satuProv) : null;
    if (cocok) return cocok;
  }
  return cocokkanWilayah(kabkota, semua);
}

export type DataKajian = {
  kajian: Kajian[];
  dibuat: string | null; // kapan data sumber dibuat
  acuan: JadwalAcuan;
  wilayah: { slug: string; nama: string }[]; // wilayah yang punya kajian, urut abjad
};

export async function muatKajian(): Promise<DataKajian> {
  const res = await fetch(URL_KAJIAN, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Data kajian: HTTP ${res.status}`);
  const json = (await res.json()) as Mentah;
  const mentah = (Array.isArray(json.kajian) ? json.kajian : []).map(dariJson).filter(Boolean) as Omit<Kajian, 'jadwalSlug'>[];

  // Cocokkan wilayah kajian dengan wilayah jadwal shalat untuk menghitung "Ba'da Maghrib".
  let semua: Wilayah[] = [];
  try {
    semua = await daftarWilayah();
  } catch {
    // API jadwal sedang gagal: kajian tetap tampil tanpa perkiraan jam.
  }
  const peta = new Map<string, Wilayah | null>();
  const kajian: Kajian[] = mentah.map((k) => {
    let w: Wilayah | null = null;
    if (k.kabkota && semua.length) {
      const kunci = `${k.kabkota}|${k.provinsi}`;
      if (!peta.has(kunci)) peta.set(kunci, wilayahJadwal(k.kabkota, k.provinsi, semua));
      w = peta.get(kunci)!;
    }
    return { ...k, jadwalSlug: w?.slug ?? null };
  });

  // Jadwal shalat 10 hari ke depan untuk wilayah yang punya kajian berpatokan waktu shalat.
  const acuan: JadwalAcuan = {};
  const perlu = new Map<string, Wilayah>();
  for (const k of kajian) {
    if (!k.jam && k.acuan && k.jadwalSlug) {
      const w = semua.find((x) => x.slug === k.jadwalSlug);
      if (w) perlu.set(w.slug, w);
    }
  }
  await Promise.all(
    [...perlu.values()].map(async (w) => {
      try {
        const j = await jadwalWilayah(w, 2);
        const mulai = tambahHari(isoTanggal(jamDinding(w.tz)), -1);
        const akhir = tambahHari(mulai, 12);
        acuan[w.slug] = Object.fromEntries(Object.entries(j).filter(([iso]) => iso >= mulai && iso <= akhir));
      } catch {
        // Lewati wilayah ini; kartu akan menampilkan "Ba'da Maghrib" tanpa jam.
      }
    }),
  );

  const wil = new Map<string, string>();
  for (const k of kajian) if (k.wilayah && k.kabkota) wil.set(k.wilayah, k.kabkota);
  return {
    kajian,
    dibuat: typeof json.dibuat === 'string' ? json.dibuat : null,
    acuan,
    wilayah: [...wil].map(([slug, nama]) => ({ slug, nama })).sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
  };
}

export const idDariSlug = (slug: string) => slug.slice(slug.lastIndexOf('-') + 1);

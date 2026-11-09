// Arsip JSON di folder data/. Data dibaca dari berkas selama masih dalam masa
// berlakunya; setelah lewat, diambil sekali dari API lalu berkasnya diperbarui.
// Bila API gagal, data lama tetap dipakai (dicoba lagi beberapa menit kemudian).
//
// Waktu pengambilan disimpan di dalam berkas ("diambil"), bukan dari waktu
// modifikasi berkas, karena git clone/checkout membuat semua berkas tampak baru.
//
// Menulis berkas hanya berhasil bila foldernya bisa ditulisi (npm run dev,
// npm run build, server sendiri). Di Vercel filesystem saat runtime hanya-baca:
// penulisan dilewati tanpa galat dan data baru disimpan di memori. Commit berkas
// data/ yang terbentuk di lokal supaya ikut ter-deploy.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const JAM = 3600e3;
const HARI = 24 * JAM;

/** Masa berlaku tiap jenis data. Ubah di sini. */
export const MASA_BERLAKU = {
  wilayah: 30 * HARI, // daftar kab/kota: berubah hanya bila ada pemekaran
  surat: Infinity, // teks Al-Qur'an dan terjemahannya: tidak berubah
  jadwal: 7 * HARI, // jadwal shalat sebulan: sesekali dikoreksi Kemenag
  kajian: 6 * JAM, // jadwal kajian: sumbernya diperbarui dua kali sehari
  tempat: 30 * HARI, // masjid & sekolah Islam per petak peta (OpenStreetMap)
};

/** Jeda sebelum mencoba API lagi setelah gagal atau datanya belum lengkap. */
const JEDA_ULANG = 10 * 60e3;

export const FOLDER_DATA = path.join(process.cwd(), 'data');

type Amplop<T> = { diambil: string; isi: T };
type Simpanan = { kedaluwarsa: number; isi: unknown };

const memori = new Map<string, Simpanan>();
const berjalan = new Map<string, Promise<unknown>>();

export async function tulisArsip(rel: string, isi: unknown, diambil = new Date()) {
  const f = path.join(FOLDER_DATA, rel);
  await mkdir(path.dirname(f), { recursive: true });
  const amplop: Amplop<unknown> = { diambil: diambil.toISOString(), isi };
  // Tulis ke berkas sementara lalu ganti nama, supaya pembaca tidak pernah melihat berkas setengah jadi.
  const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(amplop) + '\n');
  await rename(tmp, f);
}

async function bacaArsip<T>(rel: string): Promise<{ waktu: number; isi: T } | null> {
  try {
    const a = JSON.parse(await readFile(path.join(FOLDER_DATA, rel), 'utf8')) as Amplop<T>;
    const waktu = Date.parse(a?.diambil);
    return Number.isFinite(waktu) && a.isi !== undefined ? { waktu, isi: a.isi } : null;
  } catch {
    return null; // belum ada atau rusak
  }
}

/**
 * Isi arsip [rel] (relatif terhadap data/). [ambil] dipanggil bila berkas belum
 * ada atau sudah lewat [masa] ms. Hasil API disimpan hanya bila [layak]
 * (mis. jadwal sebulan sudah lengkap).
 */
export function arsip<T>(rel: string, opsi: { masa: number; ambil: () => Promise<T>; layak?: (isi: T) => boolean }): Promise<T> {
  const sekarang = Date.now();
  const m = memori.get(rel);
  if (m && sekarang < m.kedaluwarsa) return Promise.resolve(m.isi as T);
  const sedang = berjalan.get(rel);
  if (sedang) return sedang as Promise<T>;

  const janji = (async () => {
    const lama = await bacaArsip<T>(rel);
    if (lama && sekarang - lama.waktu < opsi.masa) {
      memori.set(rel, { kedaluwarsa: lama.waktu + opsi.masa, isi: lama.isi });
      return lama.isi;
    }
    try {
      const isi = await opsi.ambil();
      if (opsi.layak && !opsi.layak(isi)) {
        memori.set(rel, { kedaluwarsa: sekarang + JEDA_ULANG, isi });
        return isi;
      }
      memori.set(rel, { kedaluwarsa: sekarang + opsi.masa, isi });
      await tulisArsip(rel, isi).catch(() => {}); // filesystem hanya-baca: cukup di memori
      return isi;
    } catch (e) {
      if (!lama) throw e;
      // API gagal: pakai data lama, coba lagi nanti.
      memori.set(rel, { kedaluwarsa: sekarang + JEDA_ULANG, isi: lama.isi });
      return lama.isi;
    }
  })();
  berjalan.set(rel, janji);
  janji.finally(() => berjalan.delete(rel)).catch(() => {});
  return janji;
}

/** Baca banyak berkas tanpa memanggil API: yang segar masuk [isi], sisanya [kurang] (data lamanya di [lama]). */
export async function bacaBanyak<T>(rel: string[], masa: number) {
  const sekarang = Date.now();
  const isi = new Map<string, T>();
  const lama = new Map<string, T>();
  const kurang: string[] = [];
  await Promise.all(
    rel.map(async (r) => {
      const m = memori.get(r);
      if (m && sekarang < m.kedaluwarsa) return void isi.set(r, m.isi as T);
      const a = await bacaArsip<T>(r);
      if (a && sekarang - a.waktu < masa) {
        memori.set(r, { kedaluwarsa: a.waktu + masa, isi: a.isi });
        return void isi.set(r, a.isi);
      }
      if (a) lama.set(r, a.isi);
      kurang.push(r);
    }),
  );
  return { isi, lama, kurang };
}

/**
 * Seperti [arsip] untuk banyak berkas sekaligus: berkas yang masih segar dibaca,
 * sisanya diambil dengan SATU panggilan [ambil] (mis. satu kueri peta untuk
 * semua petak yang belum ada). Berkas yang tidak didapat masuk [gagal].
 */
export async function arsipBanyak<T>(
  rel: string[],
  opsi: { masa: number; ambil: (kurang: string[]) => Promise<Map<string, T>> },
): Promise<{ isi: Map<string, T>; gagal: string[] }> {
  const sekarang = Date.now();
  const { isi, lama, kurang } = await bacaBanyak<T>(rel, opsi.masa);
  const gagal: string[] = [];
  if (!kurang.length) return { isi, gagal };
  try {
    const baru = await opsi.ambil(kurang);
    await Promise.all(
      kurang.map(async (r) => {
        const x = baru.get(r);
        if (x === undefined) return void gagal.push(r);
        memori.set(r, { kedaluwarsa: sekarang + opsi.masa, isi: x });
        isi.set(r, x);
        await tulisArsip(r, x).catch(() => {});
      }),
    );
  } catch {
    // API gagal: pakai data lama bila ada, coba lagi nanti.
    for (const r of kurang) {
      const x = lama.get(r);
      if (x === undefined) gagal.push(r);
      else {
        memori.set(r, { kedaluwarsa: sekarang + JEDA_ULANG, isi: x });
        isi.set(r, x);
      }
    }
  }
  return { isi, gagal };
}

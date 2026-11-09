// Pembuat poster (gambar PNG) untuk dibagikan ke WhatsApp/Instagram. Digambar
// di browser dengan Canvas supaya huruf Arab tersambung dengan benar dan tidak
// perlu server. Hanya dipakai dari komponen klien.
import { latarAyat, type TemaAyat } from './poster-latar';
import { LABEL, TAMPIL, type JadwalHari, type Waktu } from './waktu';

export type IsiPoster =
  | {
      jenis: 'sholat';
      kota: string;
      provinsi: string;
      zona: string;
      tanggal: string; // "Senin, 9 November 2026"
      hijriah: string;
      jadwal: JadwalHari;
      path: string;
    }
  | {
      jenis: 'kajian';
      judul: string;
      subJudul: string | null;
      label: string | null; // "Online · Khusus Akhwat"
      ustadz: string[];
      jadwal: string; // "Setiap Senin" / "Sabtu, 14/11/2026"
      waktu: string; // "Ba'da Maghrib (±17:52 WIB)"
      berikutnya: string | null;
      tempat: string;
      wilayah: string | null;
      path: string;
    }
  | { jenis: 'ayat'; arab: string; terjemah: string; rujukan: string; tema?: TemaAyat; path: string };

export type Format = 'kotak' | 'story';
export const UKURAN: Record<Format, [number, number]> = { kotak: [1080, 1080], story: [1080, 1920] };

export type Huruf = { sans: string; arab: string };

const TEKS = '#f2f8f5';
const REDUP = '#aecbbe';
const EMAS = '#e8c35a';

const KATEGORI: Record<IsiPoster['jenis'], string> = { sholat: 'Jadwal Shalat', kajian: 'Info Kajian', ayat: 'Ayat Hari Ini' };
const URUT_STORY: Waktu[] = ['imsak', 'subuh', 'terbit', 'dzuhur', 'ashar', 'maghrib', 'isya'];

// ---------- Teks untuk dibagikan bersama gambar ----------

export function teksBagikan(isi: IsiPoster, url: string) {
  if (isi.jenis === 'sholat') {
    const baris = URUT_STORY.map((k) => `${LABEL[k]} ${isi.jadwal[k]}`).join('\n');
    return `Jadwal shalat ${isi.kota} (${isi.zona})\n${isi.tanggal}${isi.hijriah ? ` / ${isi.hijriah}` : ''}\n\n${baris}\n\nJadwal sebulan: ${url}`;
  }
  if (isi.jenis === 'kajian') {
    return [
      `*${isi.judul}*`,
      isi.subJudul,
      '',
      isi.ustadz.length ? `Pemateri: ${isi.ustadz.join(', ')}` : null,
      `Waktu: ${isi.jadwal}, ${isi.waktu}`,
      isi.berikutnya ? `Berikutnya: ${isi.berikutnya}` : null,
      `Tempat: ${isi.tempat}${isi.wilayah ? `, ${isi.wilayah}` : ''}`,
      '',
      `Info lengkap: ${url}`,
    ]
      .filter((x) => x !== null)
      .join('\n');
  }
  return `${isi.arab}\n\n“${isi.terjemah}”\n(${isi.rujukan})\n\n${url}`;
}

export function namaBerkas(isi: IsiPoster, format: Format) {
  const dasar = isi.jenis === 'sholat' ? `jadwal-shalat-${isi.kota}` : isi.jenis === 'kajian' ? `kajian-${isi.judul}` : `ayat-${isi.rujukan}`;
  const slug = dasar.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `nawaitu-${slug}-${format}.png`;
}

// ---------- Blok isi poster ----------

type Dasar = { jarak?: number }; // jarak setelah blok, dalam px pada skala 1
type Blok =
  | (Dasar & { t: 'teks'; isi: string; px: number; berat?: number; warna?: string; arab?: boolean; lh?: number; maks?: number; spasi?: number; kapital?: boolean })
  | (Dasar & { t: 'garis' })
  | (Dasar & { t: 'info'; label: string; isi: string; maks?: number })
  | (Dasar & { t: 'jadwal'; item: [string, string][]; kolom: number });

type Konteks = { c: CanvasRenderingContext2D; huruf: Huruf; x: number; lebar: number; tengah: boolean };
type Terukur = { h: number; w: number; gambar: (y: number) => void };

function susun(isi: IsiPoster, format: Format): { blok: Blok[]; tengah: boolean } {
  if (isi.jenis === 'sholat') {
    const story = format === 'story';
    return {
      tengah: true,
      blok: [
        { t: 'teks', isi: isi.kota, px: 76, berat: 800, lh: 1.15, maks: 2, jarak: 10 },
        { t: 'teks', isi: `${isi.provinsi} · ${isi.zona}`, px: 30, berat: 500, warna: REDUP, maks: 1, jarak: 34 },
        { t: 'teks', isi: isi.tanggal, px: 38, berat: 700, warna: EMAS, maks: 1, jarak: 4 },
        ...(isi.hijriah ? [{ t: 'teks', isi: isi.hijriah, px: 30, warna: REDUP, maks: 1 } as Blok] : []),
        { t: 'garis', jarak: 8 },
        story
          ? { t: 'jadwal', kolom: 1, item: URUT_STORY.map((k) => [LABEL[k], isi.jadwal[k]] as [string, string]), jarak: 30 }
          : { t: 'jadwal', kolom: 3, item: TAMPIL.map((k) => [LABEL[k], isi.jadwal[k]] as [string, string]), jarak: 26 },
        {
          t: 'teks',
          isi: story ? 'Sumber: Kemenag RI via EQuran.id' : `Imsak ${isi.jadwal.imsak} · Dhuha ${isi.jadwal.dhuha} · Sumber Kemenag RI`,
          px: 26,
          warna: REDUP,
          maks: 2,
        },
      ],
    };
  }
  if (isi.jenis === 'kajian') {
    return {
      tengah: false,
      blok: [
        ...(isi.label ? [{ t: 'teks', isi: isi.label, px: 26, berat: 700, warna: EMAS, spasi: 3, kapital: true, maks: 1, jarak: 14 } as Blok] : []),
        { t: 'teks', isi: isi.judul, px: 74, berat: 800, lh: 1.18, maks: 4, jarak: isi.subJudul ? 12 : 36 },
        ...(isi.subJudul ? [{ t: 'teks', isi: isi.subJudul, px: 38, berat: 500, warna: REDUP, lh: 1.35, maks: 2, jarak: 36 } as Blok] : []),
        { t: 'garis', jarak: 36 },
        ...(isi.ustadz.length ? [{ t: 'info', label: 'Pemateri', isi: isi.ustadz.join(', '), maks: 2, jarak: 30 } as Blok] : []),
        { t: 'info', label: 'Waktu', isi: `${isi.jadwal}\n${isi.waktu}`, maks: 3, jarak: 30 },
        ...(isi.berikutnya ? [{ t: 'info', label: 'Berikutnya', isi: isi.berikutnya, maks: 1, jarak: 30 } as Blok] : []),
        { t: 'info', label: 'Tempat', isi: isi.wilayah ? `${isi.tempat}\n${isi.wilayah}` : isi.tempat, maks: 3, jarak: 40 },
        { t: 'teks', isi: 'Jadwal bisa berubah. Cek sumber sebelum berangkat.', px: 26, warna: REDUP, maks: 2 },
      ],
    };
  }
  return {
    tengah: true,
    blok: [
      { t: 'teks', isi: isi.arab, px: 76, arab: true, lh: 1.9, maks: 7, jarak: 20 },
      { t: 'garis', jarak: 20 },
      { t: 'teks', isi: `“${isi.terjemah}”`, px: 40, berat: 500, lh: 1.5, maks: 9, jarak: 30 },
      { t: 'teks', isi: isi.rujukan, px: 32, berat: 700, warna: EMAS, spasi: 1, maks: 1 },
    ],
  };
}

function aturSpasi(c: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

/** Pecah teks menjadi baris selebar [maks] px; baris berlebih dipotong dengan "…". */
function bungkus(c: CanvasRenderingContext2D, teks: string, lebar: number, maksBaris?: number) {
  const hasil: string[] = [];
  for (const para of teks.split('\n')) {
    let baris = '';
    for (const kata of para.split(/\s+/).filter(Boolean)) {
      const coba = baris ? `${baris} ${kata}` : kata;
      if (baris && c.measureText(coba).width > lebar) {
        hasil.push(baris);
        baris = kata;
      } else baris = coba;
    }
    if (baris) hasil.push(baris);
  }
  if (maksBaris && hasil.length > maksBaris) {
    hasil.length = maksBaris;
    let akhir = hasil[maksBaris - 1];
    while (akhir.includes(' ') && c.measureText(`${akhir}…`).width > lebar) akhir = akhir.replace(/\s+\S+$/, '');
    hasil[maksBaris - 1] = `${akhir}…`;
  }
  return hasil;
}

function kotakBulat(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function ukurTeks(k: Konteks, s: number, o: {
  isi: string; px: number; berat?: number; warna?: string; arab?: boolean; lh?: number; maks?: number; spasi?: number; kapital?: boolean;
}): Terukur {
  const { c } = k;
  const px = o.px * s;
  const font = `${o.berat ?? 400} ${px}px ${o.arab ? k.huruf.arab : k.huruf.sans}`;
  const siapkan = () => {
    c.font = font;
    aturSpasi(c, (o.spasi ?? 0) * s);
    c.direction = o.arab ? 'rtl' : 'ltr';
  };
  siapkan();
  const baris = bungkus(c, o.kapital ? o.isi.toUpperCase() : o.isi, k.lebar, o.maks);
  const w = Math.max(0, ...baris.map((b) => c.measureText(b).width));
  const lh = px * (o.lh ?? 1.3);
  aturSpasi(c, 0);
  return {
    h: baris.length * lh,
    w,
    gambar(y) {
      siapkan();
      c.fillStyle = o.warna ?? TEKS;
      c.textBaseline = 'middle';
      c.textAlign = k.tengah ? 'center' : o.arab ? 'right' : 'left';
      const ax = k.tengah ? k.x + k.lebar / 2 : o.arab ? k.x + k.lebar : k.x;
      baris.forEach((b, i) => c.fillText(b, ax, y + lh * i + lh / 2));
      aturSpasi(c, 0);
      c.direction = 'ltr';
    },
  };
}

function ukur(b: Blok, s: number, k: Konteks): Terukur {
  const { c } = k;
  if (b.t === 'teks') return ukurTeks(k, s, b);
  if (b.t === 'garis') {
    const lebar = k.tengah ? 140 * s : k.lebar;
    const h = 40 * s;
    return {
      h,
      w: lebar,
      gambar(y) {
        c.fillStyle = k.tengah ? EMAS : 'rgba(255,255,255,.18)';
        c.fillRect(k.tengah ? k.x + (k.lebar - lebar) / 2 : k.x, y + h / 2 - 1.5, lebar, 3);
      },
    };
  }
  if (b.t === 'info') {
    const label = ukurTeks(k, s, { isi: b.label, px: 24, berat: 700, warna: EMAS, spasi: 3, kapital: true, maks: 1 });
    const nilai = ukurTeks(k, s, { isi: b.isi, px: 38, berat: 600, lh: 1.35, maks: b.maks });
    const jeda = 6 * s;
    return {
      h: label.h + jeda + nilai.h,
      w: Math.max(label.w, nilai.w),
      gambar(y) {
        label.gambar(y);
        nilai.gambar(y + label.h + jeda);
      },
    };
  }
  // Jadwal shalat: daftar baris (story) atau petak (kotak).
  const jeda = (b.kolom === 1 ? 14 : 18) * s;
  const lebarPetak = (k.lebar - (b.kolom - 1) * jeda) / b.kolom;
  const tinggiPetak = (b.kolom === 1 ? 96 : 168) * s;
  const jumlahBaris = Math.ceil(b.item.length / b.kolom);
  return {
    h: jumlahBaris * tinggiPetak + (jumlahBaris - 1) * jeda,
    w: k.lebar,
    gambar(y) {
      b.item.forEach(([nama, jam], i) => {
        const px = k.x + (i % b.kolom) * (lebarPetak + jeda);
        const py = y + Math.floor(i / b.kolom) * (tinggiPetak + jeda);
        kotakBulat(c, px, py, lebarPetak, tinggiPetak, 24 * s);
        c.fillStyle = 'rgba(255,255,255,.08)';
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,.14)';
        c.lineWidth = 2;
        c.stroke();
        c.textBaseline = 'middle';
        if (b.kolom === 1) {
          c.font = `600 ${34 * s}px ${k.huruf.sans}`;
          c.fillStyle = REDUP;
          c.textAlign = 'left';
          c.fillText(nama, px + 36 * s, py + tinggiPetak / 2);
          c.font = `800 ${50 * s}px ${k.huruf.sans}`;
          c.fillStyle = TEKS;
          c.textAlign = 'right';
          c.fillText(jam, px + lebarPetak - 36 * s, py + tinggiPetak / 2);
        } else {
          c.textAlign = 'center';
          c.font = `600 ${30 * s}px ${k.huruf.sans}`;
          c.fillStyle = REDUP;
          c.fillText(nama, px + lebarPetak / 2, py + tinggiPetak * 0.32);
          c.font = `800 ${62 * s}px ${k.huruf.sans}`;
          c.fillStyle = TEKS;
          c.fillText(jam, px + lebarPetak / 2, py + tinggiPetak * 0.64);
        }
      });
    },
  };
}

// ---------- Latar, kepala, kaki ----------

function cahaya(c: CanvasRenderingContext2D, x: number, y: number, r: number, warna: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, warna);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, c.canvas.width, c.canvas.height);
}

/** Bintang segi delapan (dua persegi bertumpuk), ornamen khas geometri islami. */
function bintang(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  for (const putar of [0, Math.PI / 4]) {
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = putar + (i * Math.PI) / 2;
      c[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a));
    }
    c.closePath();
    c.stroke();
  }
}

function latar(c: CanvasRenderingContext2D, W: number, H: number) {
  const g = c.createLinearGradient(0, 0, W * 0.6, H);
  g.addColorStop(0, '#0a2b21');
  g.addColorStop(0.55, '#0e3b2e');
  g.addColorStop(1, '#14573f');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  cahaya(c, W * 0.95, 0, Math.max(W, H) * 0.6, 'rgba(232,195,90,.20)');
  cahaya(c, 0, H, Math.max(W, H) * 0.55, 'rgba(63,174,133,.24)');
  c.save();
  c.strokeStyle = 'rgba(232,195,90,.09)';
  c.lineWidth = 2;
  for (const r of [260, 190, 120]) bintang(c, W - 40, H * 0.2, r);
  for (const r of [200, 130]) bintang(c, 30, H * 0.86, r);
  c.restore();
}

// ---------- Gambar ----------

export function gambarPoster(cv: HTMLCanvasElement, isi: IsiPoster, format: Format, huruf: Huruf, logo: HTMLImageElement | null, host: string) {
  const [W, H] = UKURAN[format];
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  if (!c) throw new Error('Canvas tidak didukung');
  const P = 88;
  // Story: sisakan ruang di atas/bawah yang tertutup tombol Instagram/WhatsApp.
  const atas = format === 'story' ? 210 : 76;
  const bawah = format === 'story' ? 200 : 64;

  // Poster ayat dibuat bersih: merek kecil dan samar, tanpa alamat situs di bawah.
  const polos = isi.jenis === 'ayat';
  if (polos) latarAyat(c, W, H, isi.tema ?? 'fajar');
  else latar(c, W, H);

  // Kepala: logo + nama, kategori di kanan.
  const tinggiLogo = polos ? 34 : 72;
  const kepalaY = atas + tinggiLogo / 2;
  let xNama = P;
  if (logo) {
    const lebarLogo = (tinggiLogo * logo.naturalWidth) / logo.naturalHeight;
    c.globalAlpha = polos ? 0.32 : 1;
    c.drawImage(logo, P, atas, lebarLogo, tinggiLogo);
    c.globalAlpha = 1;
    xNama += lebarLogo + (polos ? 10 : 18);
  }
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillStyle = polos ? 'rgba(242,248,245,.34)' : TEKS;
  c.font = polos ? `500 22px ${huruf.sans}` : `800 46px ${huruf.sans}`;
  c.fillText('Nawaitu', xNama, kepalaY + 2);

  const kategori = KATEGORI[isi.jenis].toUpperCase();
  const tk = polos ? 40 : 52;
  c.font = `700 ${polos ? 19 : 24}px ${huruf.sans}`;
  aturSpasi(c, 3);
  const lebarKat = c.measureText(kategori).width + (polos ? 40 : 48);
  kotakBulat(c, W - P - lebarKat, kepalaY - tk / 2, lebarKat, tk, tk / 2);
  c.strokeStyle = polos ? 'rgba(232,195,90,.6)' : EMAS;
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = polos ? 'rgba(232,195,90,.85)' : EMAS;
  c.textAlign = 'center';
  c.fillText(kategori, W - P - lebarKat / 2 + 1.5, kepalaY + 1);
  aturSpasi(c, 0);

  // Kaki: alamat situs.
  const kakiY = H - bawah;
  if (!polos) {
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.fillRect(P, kakiY - 70, W - 2 * P, 2);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillStyle = TEKS;
    c.font = `700 30px ${huruf.sans}`;
    c.fillText(host, P, kakiY - 26);
    c.textAlign = 'right';
    c.fillStyle = REDUP;
    c.font = `500 26px ${huruf.sans}`;
    c.fillText('Teman ibadah harian Anda', W - P, kakiY - 26);
  }

  // Isi: perkecil sampai muat di antara kepala dan kaki, lalu letakkan di tengah.
  const { blok, tengah } = susun(isi, format);
  const k: Konteks = { c, huruf, x: P, lebar: W - 2 * P, tengah };
  const y0 = atas + tinggiLogo + (polos ? 56 : 64);
  const tinggi = (polos ? H - bawah - 24 : kakiY - 70 - 56) - y0;
  let s = 1;
  let hasil: Terukur[] = [];
  let total = 0;
  for (; ; s -= 0.04) {
    hasil = blok.map((b) => ukur(b, s, k));
    total = hasil.reduce((n, u, i) => n + u.h + (i < blok.length - 1 ? (blok[i].jarak ?? 24) * s : 0), 0);
    if ((total <= tinggi && hasil.every((u) => u.w <= k.lebar + 1)) || s <= 0.5) break;
  }
  let y = y0 + Math.max(0, (tinggi - total) / 2);
  if (isi.jenis === 'ayat') {
    c.shadowColor = 'rgba(0,0,0,.55)';
    c.shadowBlur = 18;
    c.shadowOffsetY = 2;
  }
  hasil.forEach((u, i) => {
    u.gambar(y);
    y += u.h + (blok[i].jarak ?? 24) * s;
  });
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
}

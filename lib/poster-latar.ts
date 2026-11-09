// Latar bergambar untuk poster ayat, digambar dengan Canvas (tanpa berkas gambar), sesuai tema
// makna ayatnya. Semua bentuk dibuat dari seed tetap, jadi ayat yang sama selalu tampil sama.

export type TemaAyat = 'fajar' | 'malam' | 'gunung' | 'hujan' | 'cahaya' | 'masjid' | 'taman';

type C = CanvasRenderingContext2D;

function acak(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function langit(c: C, W: number, H: number, henti: [number, string][]) {
  const g = c.createLinearGradient(0, 0, 0, H);
  henti.forEach(([p, w]) => g.addColorStop(p, w));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  dither(c, W, H);
}

/** Bintik sangat halus agar gradien tidak berpita (banding) saat dikompres. */
function dither(c: C, W: number, H: number) {
  const ubin = document.createElement('canvas');
  ubin.width = ubin.height = 128;
  const u = ubin.getContext('2d');
  if (!u) return;
  const data = u.createImageData(128, 128);
  const r = acak(99);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = r() < 0.5 ? 0 : 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 9;
  }
  u.putImageData(data, 0, 0);
  const pola = c.createPattern(ubin, 'repeat');
  if (pola) {
    c.fillStyle = pola;
    c.fillRect(0, 0, W, H);
  }
}

/** Cahaya lembut; [warna] harus rgba(r,g,b,a). */
function cahayaBulat(c: C, x: number, y: number, r: number, warna: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, warna);
  g.addColorStop(1, warna.replace(/[\d.]+\)$/, '0)'));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Gelapkan warna hex "#rrggbb" sebesar faktor [f] (0..1). */
function gelapkan(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const k = (v: number) => Math.round(v * f);
  return `rgb(${k((n >> 16) & 255)},${k((n >> 8) & 255)},${k(n & 255)})`;
}

/** Bukit bergelombang dari beberapa gelombang sinus, berwarna gradien (terang di puncak, gelap di kaki). */
function bukit(c: C, W: number, H: number, y: number, amp: number, warna: string, seed: number, kabut?: string) {
  const r = acak(seed);
  const f = [0.0016 + r() * 0.002, 0.004 + r() * 0.003, 0.009 + r() * 0.004];
  const p = [r() * 6.3, r() * 6.3, r() * 6.3];
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) {
    c.lineTo(x, y + amp * (Math.sin(x * f[0] + p[0]) * 0.6 + Math.sin(x * f[1] + p[1]) * 0.3 + Math.sin(x * f[2] + p[2]) * 0.1));
  }
  c.lineTo(W, H);
  c.closePath();
  const g = c.createLinearGradient(0, y - amp, 0, Math.min(H, y + H * 0.2));
  g.addColorStop(0, warna);
  g.addColorStop(1, gelapkan(warna, 0.62));
  c.fillStyle = g;
  c.fill();
  if (kabut) {
    // Kabut tipis di puncak bukit agar menyatu dengan langit.
    const m = c.createLinearGradient(0, y - amp * 1.3, 0, y + H * 0.06);
    m.addColorStop(0, kabut.replace(/[\d.]+\)$/, '0)'));
    m.addColorStop(0.3, kabut);
    m.addColorStop(1, kabut.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = m;
    c.fillRect(0, y - amp * 1.3, W, amp * 1.3 + H * 0.06);
  }
}

/** Punggung gunung bergerigi (midpoint displacement), diberi kabut tipis di kakinya. */
function gunungan(c: C, W: number, H: number, y: number, tinggi: number, warna: string, seed: number, kabut = true) {
  const r = acak(seed);
  let pts = [0.5 + (r() - 0.5) * 0.3, 0.5 + (r() - 0.5) * 0.3];
  let d = 1;
  for (let i = 0; i < 7; i++) {
    const baru: number[] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      baru.push(pts[j], (pts[j] + pts[j + 1]) / 2 + (r() - 0.5) * d);
    }
    baru.push(pts[pts.length - 1]);
    pts = baru;
    d *= 0.52;
  }
  c.beginPath();
  c.moveTo(0, H);
  pts.forEach((v, i) => c.lineTo((i / (pts.length - 1)) * W, y - v * tinggi));
  c.lineTo(W, H);
  c.closePath();
  c.fillStyle = warna;
  c.fill();
  if (kabut) {
    const g = c.createLinearGradient(0, y - tinggi * 0.2, 0, y + tinggi * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(235,245,240,.22)');
    c.fillStyle = g;
    c.fillRect(0, y - tinggi * 0.2, W, tinggi * 0.7);
  }
}

function sinar(c: C, x: number, y: number, panjang: number, dari: number, sampai: number, n: number, warna: string, lebarSudut: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, panjang);
  g.addColorStop(0, warna);
  g.addColorStop(1, warna.replace(/[\d.]+\)$/, '0)'));
  c.fillStyle = g;
  for (let i = 0; i < n; i++) {
    const a = dari + ((sampai - dari) * (i + 0.5)) / n;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a - lebarSudut) * panjang, y + Math.sin(a - lebarSudut) * panjang);
    c.lineTo(x + Math.cos(a + lebarSudut) * panjang, y + Math.sin(a + lebarSudut) * panjang);
    c.closePath();
    c.fill();
  }
}

function bintangKecil(c: C, W: number, yMaks: number, n: number, seed: number) {
  const r = acak(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * yMaks, rad = 0.8 + r() * 1.8;
    c.fillStyle = `rgba(255,248,225,${0.35 + r() * 0.6})`;
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 12; i++) {
    const x = r() * W, y = r() * yMaks * 0.85, s = 7 + r() * 9;
    c.fillStyle = 'rgba(255,244,205,.85)';
    c.beginPath();
    c.moveTo(x, y - s);
    c.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y);
    c.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s);
    c.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y);
    c.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s);
    c.fill();
  }
}

function sabit(c: C, x: number, y: number, r: number, warna: string) {
  cahayaBulat(c, x, y, r * 3.2, 'rgba(255,240,190,.35)');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.arc(x + r * 0.42, y - r * 0.16, r * 0.84, 0, Math.PI * 2, true);
  c.fillStyle = warna;
  c.fill();
}

// ---------- Adegan ----------

function fajar(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#0a2638'], [0.42, '#1f5f66'], [0.7, '#e9b868'], [0.82, '#f8dea0']]);
  const sx = W * 0.5, sy = H * 0.8;
  cahayaBulat(c, sx, sy, H * 0.55, 'rgba(255,226,150,.85)');
  cahayaBulat(c, sx, sy, H * 0.2, 'rgba(255,246,210,.9)');
  sinar(c, sx, sy, H * 1.1, Math.PI, Math.PI * 2, 18, 'rgba(255,235,170,.10)', 0.05);
  bukit(c, W, H, H * 0.82, H * 0.03, '#5d9a6c', 11, 'rgba(255,226,160,.30)');
  bukit(c, W, H, H * 0.87, H * 0.03, '#3d8059', 12, 'rgba(255,226,160,.16)');
  bukit(c, W, H, H * 0.92, H * 0.028, '#276247', 13);
  bukit(c, W, H, H * 0.97, H * 0.022, '#164a37', 14);
}

function malam(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#030c12'], [0.55, '#0a2b2f'], [1, '#0e4a3a']]);
  bintangKecil(c, W, H * 0.66, 170, 21);
  sabit(c, W * 0.76, H * 0.2, H * 0.07, '#fff1c0');
  bukit(c, W, H, H * 0.76, H * 0.03, '#04171a', 22);
  const air = H * 0.8;
  const g = c.createLinearGradient(0, air, 0, H);
  g.addColorStop(0, '#0b3335');
  g.addColorStop(1, '#04161a');
  c.fillStyle = g;
  c.fillRect(0, air, W, H - air);
  // Pantulan bulan di air.
  const r = acak(23);
  for (let i = 0; i < 26; i++) {
    const y = air + 10 + i * ((H - air - 20) / 26);
    const lebar = (90 - i * 2.2) * (0.6 + r() * 0.8) * (H / 1080);
    c.fillStyle = `rgba(255,236,170,${0.34 - i * 0.011})`;
    c.fillRect(W * 0.76 - lebar / 2 + (r() - 0.5) * 20, y, lebar, 3);
  }
}

function gunung(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#12343f'], [0.5, '#2f6f73'], [0.8, '#cfe3c9'], [1, '#e9efd5']]);
  cahayaBulat(c, W * 0.3, H * 0.55, H * 0.45, 'rgba(255,255,240,.55)');
  gunungan(c, W, H, H * 0.58, H * 0.2, '#7aa9a5', 31);
  gunungan(c, W, H, H * 0.68, H * 0.22, '#4f8b80', 32);
  gunungan(c, W, H, H * 0.78, H * 0.2, '#2d6150', 33);
  gunungan(c, W, H, H * 0.9, H * 0.16, '#143c31', 34);
}

function hujan(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#17353c'], [0.5, '#3b6a6a'], [1, '#6f9a8a']]);
  const r = acak(41);
  // Awan.
  for (let i = 0; i < 12; i++) {
    const cx = (i / 11) * W * 1.1 - W * 0.05, cy = H * (0.05 + r() * 0.12);
    for (let j = 0; j < 7; j++) {
      c.beginPath();
      c.arc(cx + (j - 3) * 55 * (H / 1080), cy + (r() - 0.5) * 40, (70 + r() * 70) * (H / 1080), 0, Math.PI * 2);
      c.fillStyle = `rgba(${200 + r() * 25},${220 + r() * 20},${215 + r() * 20},${0.34 + r() * 0.18})`;
      c.fill();
    }
  }
  // Pelangi samar di balik bukit.
  const warnaPelangi = ['#ff6b6b', '#ffb454', '#ffe66d', '#7bdc8f', '#6bb7ff', '#a58bff'];
  warnaPelangi.forEach((w, i) => {
    c.beginPath();
    c.arc(W * 0.5, H * 1.02, W * 0.62 - i * 15, Math.PI, Math.PI * 2);
    c.strokeStyle = w;
    c.globalAlpha = 0.16;
    c.lineWidth = 15;
    c.stroke();
    c.globalAlpha = 1;
  });
  bukit(c, W, H, H * 0.82, H * 0.04, '#2d6b4a', 42);
  bukit(c, W, H, H * 0.9, H * 0.035, '#1b4a35', 43);
  // Hujan.
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(225,242,236,.3)';
  c.lineWidth = 2.2;
  for (let i = 0; i < 280; i++) {
    const x = r() * W * 1.1, y = r() * H * 0.9, len = 40 + r() * 55;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - len * 0.18, y + len);
    c.stroke();
  }
}

function cahaya(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#071f1a'], [0.5, '#0c342a'], [1, '#0a2a22']]);
  const x = W * 0.5, y = H * 0.1;
  cahayaBulat(c, x, y, H * 0.75, 'rgba(255,224,140,.6)');
  sinar(c, x, y, H * 1.4, Math.PI * 0.08, Math.PI * 0.92, 34, 'rgba(255,230,150,.07)', 0.03);
  sinar(c, x, y, H * 1.1, Math.PI * 0.2, Math.PI * 0.8, 12, 'rgba(255,240,190,.1)', 0.045);
  c.beginPath();
  c.arc(x, y, H * 0.045, 0, Math.PI * 2);
  c.fillStyle = '#fff6d6';
  c.fill();
  const r = acak(51);
  for (let i = 0; i < 130; i++) {
    c.beginPath();
    c.arc(r() * W, r() * H, 1 + r() * 3, 0, Math.PI * 2);
    c.fillStyle = `rgba(255,226,150,${0.12 + r() * 0.5})`;
    c.fill();
  }
  bukit(c, W, H, H * 0.93, H * 0.02, '#06231b', 52);
}

function masjid(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#0a2638'], [0.45, '#2a6a6a'], [0.7, '#e4b46a'], [0.76, '#f4d395']]);
  bintangKecil(c, W, H * 0.4, 60, 61);
  sabit(c, W * 0.2, H * 0.17, H * 0.045, '#fff1c0');
  cahayaBulat(c, W * 0.5, H * 0.78, H * 0.45, 'rgba(255,214,140,.5)');

  const gelap = '#051a14';
  const cx = W * 0.5, yb = H * 0.86;
  c.fillStyle = gelap;
  // Kubah utama.
  const kw = W * 0.26, kh = H * 0.13;
  c.beginPath();
  c.moveTo(cx - kw / 2, yb);
  c.bezierCurveTo(cx - kw / 2, yb - kh * 1.45, cx + kw / 2, yb - kh * 1.45, cx + kw / 2, yb);
  c.fill();
  c.fillRect(cx - 3, yb - kh * 1.08 - H * 0.04, 6, H * 0.04);
  c.beginPath();
  c.arc(cx, yb - kh * 1.08 - H * 0.05, H * 0.011, 0, Math.PI * 2);
  c.fill();
  // Kubah kecil.
  for (const s of [-1, 1]) {
    const x = cx + s * W * 0.15, w = W * 0.1, h = H * 0.06;
    c.beginPath();
    c.moveTo(x - w / 2, yb);
    c.bezierCurveTo(x - w / 2, yb - h * 1.45, x + w / 2, yb - h * 1.45, x + w / 2, yb);
    c.fill();
  }
  // Menara.
  for (const s of [-1, 1]) {
    const x = cx + s * W * 0.29, w = W * 0.032, t = H * 0.26;
    c.fillRect(x - w / 2, yb - t, w, t);
    c.fillRect(x - w * 0.95, yb - t * 0.78, w * 1.9, H * 0.012);
    c.beginPath();
    c.moveTo(x - w * 0.75, yb - t);
    c.lineTo(x, yb - t - H * 0.055);
    c.lineTo(x + w * 0.75, yb - t);
    c.fill();
    c.fillRect(x - 1.5, yb - t - H * 0.085, 3, H * 0.035);
  }
  // Badan dan tanah.
  c.fillRect(cx - kw * 0.62, yb - H * 0.012, kw * 1.24, H);
  c.fillRect(0, yb + H * 0.02, W, H);
  // Jendela bercahaya.
  c.fillStyle = 'rgba(255,205,115,.75)';
  for (const dx of [-0.2, -0.1, 0, 0.1, 0.2]) {
    const x = cx + dx * W * 0.62, w = W * 0.016, y = yb + H * 0.03;
    c.beginPath();
    c.moveTo(x - w, y + H * 0.05);
    c.lineTo(x - w, y + H * 0.015);
    c.arc(x, y + H * 0.015, w, Math.PI, 0);
    c.lineTo(x + w, y + H * 0.05);
    c.fill();
  }
}

function taman(c: C, W: number, H: number) {
  langit(c, W, H, [[0, '#0f3d33'], [0.5, '#2f7f5a'], [0.85, '#a8d98a']]);
  cahayaBulat(c, W * 0.12, H * 0.05, H * 0.6, 'rgba(255,240,170,.55)');
  sinar(c, W * 0.1, -H * 0.02, H * 1.3, Math.PI * 0.08, Math.PI * 0.5, 9, 'rgba(255,245,190,.08)', 0.04);
  const r = acak(71);
  for (let i = 0; i < 36; i++) {
    cahayaBulat(c, r() * W, H * (0.2 + r() * 0.5), 14 + r() * 26, 'rgba(255,255,200,.16)');
  }
  bukit(c, W, H, H * 0.7, H * 0.04, '#3d8f5e', 72);
  // Pepohonan.
  const pohon = (x: number, y: number, s: number, warna: string) => {
    c.fillStyle = '#0a2a1f';
    c.fillRect(x - 5 * s, y - 30 * s, 10 * s, 40 * s);
    c.fillStyle = warna;
    for (const [dx, dy, rr] of [[0, -90, 58], [-38, -62, 44], [38, -62, 44], [0, -50, 50]]) {
      c.beginPath();
      c.arc(x + dx * s, y + dy * s, rr * s, 0, Math.PI * 2);
      c.fill();
    }
  };
  for (let i = 0; i < 9; i++) pohon(r() * W, H * (0.72 + r() * 0.04), (H / 1080) * (0.8 + r() * 0.6), '#16513a');
  bukit(c, W, H, H * 0.8, H * 0.035, '#1f6b48', 73);
  for (let i = 0; i < 6; i++) pohon(r() * W, H * (0.82 + r() * 0.04), (H / 1080) * (1 + r() * 0.5), '#0f3f2d');
  bukit(c, W, H, H * 0.9, H * 0.03, '#0d3d2b', 74);
  // Bunga di depan.
  const warnaBunga = ['#ffd6e0', '#fff3b0', '#ffffff', '#ffb3c7'];
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = H * (0.9 + r() * 0.09);
    c.fillStyle = warnaBunga[i % warnaBunga.length];
    c.globalAlpha = 0.85;
    c.beginPath();
    c.arc(x, y, 3 + r() * 4, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
}

const ADEGAN: Record<TemaAyat, (c: C, W: number, H: number) => void> = { fajar, malam, gunung, hujan, cahaya, masjid, taman };

/** Gambar latar bertema, lalu redupkan bagian tengah agar teks tetap mudah dibaca. */
export function latarAyat(c: C, W: number, H: number, tema: TemaAyat) {
  c.save();
  ADEGAN[tema](c, W, H);
  c.restore();
  const g = c.createRadialGradient(W / 2, H * 0.44, 0, W / 2, H * 0.44, Math.max(W, H) * 0.56);
  g.addColorStop(0, 'rgba(3,14,10,.7)');
  g.addColorStop(0.55, 'rgba(3,14,10,.5)');
  g.addColorStop(1, 'rgba(3,14,10,.12)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

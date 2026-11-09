// Isi situs. Ubah di sini lalu deploy ulang.

export const situs = {
  nama: "Nawaitu",
  tagline: "Teman ibadah harian Anda",
  // Deskripsi beranda (meta description, idealnya 120-160 karakter).
  deskripsi: "Nawaitu, teman ibadah harian Anda. Jadwal shalat (sholat) per kota, kajian islami, dan artikel. Aplikasi Android dengan adzan dan tracker puasa.",
  // Alamat situs tanpa garis miring di akhir. Di Vercel terisi otomatis dari domain produksi;
  // isi NEXT_PUBLIC_SITE_URL bila memakai domain sendiri.
  url: (process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, ""),
  playStore: "", // tempel tautan Play Store bila sudah ada
};

export type Artikel = { slug: string; judul: string; ringkas: string; isi: string };

// "isi" berupa HTML yang Anda tulis sendiri (jangan menempel HTML dari sumber tak tepercaya).
// Tinjau isinya bersama ustadz sebelum dipublikasikan.
export const artikel: Artikel[] = [
  {
    "slug": "niat-sholat-subuh",
    "judul": "Niat Shalat Subuh",
    "ringkas": "Lafaz niat dan hal yang perlu dipahami tentang niat.",
    "isi": "<p>Niat adalah tekad di dalam hati untuk mengerjakan shalat tertentu. Melafazkannya dianjurkan sebagian ulama untuk membantu hati, tetapi pokoknya adalah niat di hati.</p>\n<p class=\"arab\">أُصَلِّي فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى</p>\n<p><i>Ushalli fardhash shubhi rak'ataini mustaqbilal qiblati adaa-an lillaahi ta'aalaa.</i></p>\n<p>Artinya: \"Aku berniat shalat fardhu Subuh dua rakaat menghadap kiblat, tepat waktu, karena Allah Ta'ala.\"</p>\n<h2>Yang perlu diingat</h2>\n<ul><li>Shalat Subuh dua rakaat.</li><li>Niat dilakukan bersamaan dengan takbiratul ihram.</li><li>Sebagai makmum, tambahkan niat sebagai makmum.</li></ul>"
  },
  {
    "slug": "rukun-wudhu",
    "judul": "Rukun Wudhu Menurut Mazhab Syafi'i",
    "ringkas": "Enam rukun wudhu yang harus terpenuhi agar wudhu sah.",
    "isi": "<p>Menurut mazhab Syafi'i, wudhu sah bila memenuhi enam rukun berikut, dikerjakan berurutan.</p>\n<ol><li>Niat di hati ketika mulai membasuh wajah.</li><li>Membasuh seluruh wajah.</li><li>Membasuh kedua tangan sampai siku.</li><li>Mengusap sebagian kepala.</li><li>Membasuh kedua kaki sampai mata kaki.</li><li>Tertib, sesuai urutan di atas.</li></ol>\n<p>Rincian antar mazhab berbeda. Ikuti mazhab yang Anda anut atau tanyakan kepada ustadz setempat.</p>"
  }
];

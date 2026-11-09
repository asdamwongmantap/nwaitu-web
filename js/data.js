// Semua isi situs ada di file ini. Ubah di sini, jalankan "node build.js", unggah folder dist.
const DATA = {
  situs: {
    nama: 'Nawaitu',
    url: 'https://domainanda.com', // ganti dengan domain Anda (tanpa garis miring di akhir)
    playStore: '',                 // tempel tautan Play Store bila sudah ada
  },

  // tz: selisih jam dari UTC (WIB 7, WITA 8, WIT 9)
  kota: [
    { slug: 'jakarta', nama: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 7, zona: 'WIB' },
    { slug: 'bandung', nama: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 7, zona: 'WIB' },
    { slug: 'semarang', nama: 'Semarang', lat: -6.9667, lng: 110.4167, tz: 7, zona: 'WIB' },
    { slug: 'yogyakarta', nama: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 7, zona: 'WIB' },
    { slug: 'surabaya', nama: 'Surabaya', lat: -7.2504, lng: 112.7688, tz: 7, zona: 'WIB' },
    { slug: 'medan', nama: 'Medan', lat: 3.5952, lng: 98.6722, tz: 7, zona: 'WIB' },
    { slug: 'makassar', nama: 'Makassar', lat: -5.1477, lng: 119.4327, tz: 8, zona: 'WITA' },
  ],

  // Event kajian. "tanggal" format YYYY-MM-DD. Event yang sudah lewat otomatis tidak ditampilkan.
  // Entri bertanda contoh:true hanyalah contoh format: ganti atau hapus sebelum dipublikasikan.
  kajian: [
    {
      slug: 'contoh-kajian-fiqih-puasa', judul: 'Kajian Fiqih Puasa Sunnah (contoh)',
      pemateri: 'Nama pemateri', tanggal: '2026-12-05', jam: '19:30', kota: 'jakarta',
      tempat: 'Nama masjid, alamat', ket: 'Ganti dengan keterangan acara yang sebenarnya.',
      unggulan: true, contoh: true,
    },
  ],

  // Artikel. "isi" berupa HTML yang Anda tulis sendiri (jangan menempel HTML dari sumber tak tepercaya).
  // Tinjau isinya bersama ustadz sebelum dipublikasikan.
  artikel: [
    {
      slug: 'niat-sholat-subuh', judul: 'Niat Sholat Subuh',
      ringkas: 'Lafaz niat dan hal yang perlu dipahami tentang niat.',
      isi: `
<p>Niat adalah tekad di dalam hati untuk mengerjakan sholat tertentu. Melafazkannya dianjurkan sebagian ulama untuk membantu hati, tetapi pokoknya adalah niat di hati.</p>
<p class="arab">أُصَلِّي فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى</p>
<p><i>Ushalli fardhash shubhi rak'ataini mustaqbilal qiblati adaa-an lillaahi ta'aalaa.</i></p>
<p>Artinya: "Aku berniat sholat fardhu Subuh dua rakaat menghadap kiblat, tepat waktu, karena Allah Ta'ala."</p>
<h2>Yang perlu diingat</h2>
<ul><li>Sholat Subuh dua rakaat.</li><li>Niat dilakukan bersamaan dengan takbiratul ihram.</li><li>Sebagai makmum, tambahkan niat sebagai makmum.</li></ul>`,
    },
    {
      slug: 'rukun-wudhu', judul: "Rukun Wudhu Menurut Mazhab Syafi'i",
      ringkas: 'Enam rukun wudhu yang harus terpenuhi agar wudhu sah.',
      isi: `
<p>Menurut mazhab Syafi'i, wudhu sah bila memenuhi enam rukun berikut, dikerjakan berurutan.</p>
<ol><li>Niat di hati ketika mulai membasuh wajah.</li><li>Membasuh seluruh wajah.</li><li>Membasuh kedua tangan sampai siku.</li><li>Mengusap sebagian kepala.</li><li>Membasuh kedua kaki sampai mata kaki.</li><li>Tertib, sesuai urutan di atas.</li></ol>
<p>Rincian antar mazhab berbeda. Ikuti mazhab yang Anda anut atau tanyakan kepada ustadz setempat.</p>`,
    },
  ],
};

if (typeof module !== 'undefined') module.exports = DATA;
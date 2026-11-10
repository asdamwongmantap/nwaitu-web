// "Kutipan hari ini": lima kutipan pengembangan diri per hari, bergilir dari daftar di bawah.
// Dua jenis sumber: hadis dan ungkapan klasik yang riwayat/rujukannya jelas, serta kalimat yang ditulis
// sendiri untuk Nawaitu. Kutipan "terkenal" tanpa rujukan pasti sengaja tidak dipakai (rawan salah atribusi).
// Terjemahan hadis di bawah berupa ringkasan makna; tinjau bersama ustadz sebelum dipublikasikan luas.
import type { TemaAyat } from './poster-latar';
import { isoTanggal, jamDinding } from './waktu';

export type Kutipan = {
  teks: string;
  /** Siapa yang mengucapkan, mis. "Nabi Muhammad ﷺ". Kosong = tidak ada keterangan asal yang ditampilkan. */
  penutur?: string;
  /** Asal kutipan: perawi hadis atau kitab. */
  rujukan?: string;
  jenis?: 'Hadis' | 'Hikmah';
  tema: TemaAyat;
};

/** "Penutur · rujukan" untuk poster dan teks bagikan; string kosong bila kutipan tidak punya asal. */
export const sumberKutipan = (k: Kutipan) => [k.penutur, k.rujukan].filter(Boolean).join(' · ');

export const JUMLAH_HARIAN = 5;

const ORISINAL: Kutipan[] = [
  { teks: 'Langkah kecil yang diulang setiap hari mengalahkan semangat besar yang hanya datang sesekali.', tema: 'gunung' },
  { teks: 'Jangan menunggu siap sempurna. Mulai dari yang ada, perbaiki sambil berjalan.', tema: 'gunung' },
  { teks: 'Kebiasaan baik dibangun dari satu hari yang tidak dilewatkan, lalu hari berikutnya.', tema: 'gunung' },
  { teks: 'Amalan yang paling berharga bukan yang terbesar, tetapi yang terus dijaga.', tema: 'gunung' },
  { teks: 'Bila hari ini terasa berat, kerjakan versi paling kecilnya. Yang penting rantainya tidak putus.', tema: 'gunung' },
  { teks: 'Kemajuan jarang terlihat dalam sehari, tetapi sangat jelas dalam setahun.', tema: 'gunung' },
  { teks: 'Disiplin adalah cara menepati janji kepada diri sendiri.', tema: 'gunung' },
  { teks: 'Satu pekerjaan yang dikerjakan dengan penuh perhatian lebih berarti daripada sepuluh yang setengah-setengah.', tema: 'cahaya' },
  { teks: 'Tanyakan pada diri: apakah ini penting, atau hanya mendesak? Lalu kerjakan yang penting dahulu.', tema: 'cahaya' },
  { teks: 'Perhatianmu adalah modal paling mahal. Pilih untuk apa kamu membelanjakannya.', tema: 'cahaya' },
  { teks: 'Menolak hal yang tidak perlu adalah cara memberi ruang bagi hal yang berarti.', tema: 'cahaya' },
  { teks: 'Tenang dulu, baru bergerak. Pikiran yang jernih menghemat banyak langkah.', tema: 'cahaya' },
  { teks: 'Selesaikan satu hal kecil pagi ini. Rasa tuntasnya akan menarikmu ke hal berikutnya.', tema: 'cahaya' },
  { teks: 'Ramai bukan berarti maju. Ukur harimu dari yang selesai, bukan dari yang sibuk.', tema: 'cahaya' },
  { teks: 'Gagal berarti kamu sedang mencoba. Yang berbahaya adalah berhenti belajar darinya.', tema: 'hujan' },
  { teks: 'Jangan bandingkan bab pertamamu dengan bab kesepuluh orang lain.', tema: 'hujan' },
  { teks: 'Kamu tidak harus mengendalikan semua keadaan, cukup mengendalikan cara menanggapinya.', tema: 'hujan' },
  { teks: 'Berbicaralah kepada dirimu seperti kepada sahabat yang sedang kamu semangati.', tema: 'hujan' },
  { teks: 'Takut itu wajar. Melangkah sambil takut itulah yang disebut berani.', tema: 'hujan' },
  { teks: 'Setelah jatuh, tidak apa-apa duduk sebentar. Yang penting bangun lagi.', tema: 'hujan' },
  { teks: 'Kesulitan sering menjadi guru yang paling jujur. Dengarkan pelajarannya.', tema: 'hujan' },
  { teks: 'Orang yang merasa cukup belajar sedang berhenti bertumbuh.', tema: 'taman' },
  { teks: 'Bertanya bukan tanda lemah. Itu jalan pintas menuju paham.', tema: 'taman' },
  { teks: 'Satu halaman sehari berarti belasan buku dalam setahun.', tema: 'taman' },
  { teks: 'Ilmu yang tidak diamalkan seperti bekal yang tidak pernah dimakan.', tema: 'taman' },
  { teks: 'Catat satu pelajaran setiap malam. Dalam sebulan kamu punya buku sendiri.', tema: 'taman' },
  { teks: 'Kritik yang jujur adalah hadiah, meski dibungkus kurang rapi.', tema: 'taman' },
  { teks: 'Jadilah murid seumur hidup. Kerendahan hati membuka pintu yang tidak terbuka bagi kesombongan.', tema: 'taman' },
  { teks: 'Waktu tidak bisa diminta kembali. Pakai hari ini sebaik yang kamu mampu.', tema: 'fajar' },
  { teks: 'Yang kamu tunda hari ini diam-diam menjadi beban esok hari.', tema: 'fajar' },
  { teks: 'Bangun lebih awal bukan soal jam, melainkan soal memberi dirimu waktu yang tenang.', tema: 'fajar' },
  { teks: 'Mulailah dengan niat yang lurus. Hasil baik biasanya mengikuti arah yang benar.', tema: 'fajar' },
  { teks: 'Berubah tidak menunggu tahun baru. Hari ini juga bisa menjadi hari pertama.', tema: 'fajar' },
  { teks: 'Syukuri yang sudah ada, kejar yang belum ada. Keduanya bisa jalan bersamaan.', tema: 'fajar' },
  { teks: 'Jadilah sedikit lebih baik dari dirimu kemarin. Itu sudah lebih dari cukup.', tema: 'fajar' },
];

const RUJUKAN: Kutipan[] = [
  { teks: 'Amalan yang paling dicintai Allah ialah yang paling konsisten, meski sedikit.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari & Muslim', jenis: 'Hadis', tema: 'gunung' },
  { teks: 'Sebaik-baik manusia ialah yang paling bermanfaat bagi sesama.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Ahmad', jenis: 'Hadis', tema: 'taman' },
  { teks: 'Dua nikmat yang sering dilalaikan kebanyakan orang: kesehatan dan waktu luang.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari', jenis: 'Hadis', tema: 'fajar' },
  { teks: 'Orang kuat bukanlah yang menang bergulat, melainkan yang mampu menahan diri ketika marah.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari & Muslim', jenis: 'Hadis', tema: 'gunung' },
  { teks: 'Di antara tanda baiknya keislaman seseorang ialah meninggalkan hal yang tidak bermanfaat baginya.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Tirmidzi', jenis: 'Hadis', tema: 'cahaya' },
  { teks: 'Bersungguh-sungguhlah pada hal yang bermanfaat bagimu, mohonlah pertolongan Allah, dan jangan merasa lemah.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Muslim', jenis: 'Hadis', tema: 'fajar' },
  { teks: 'Setiap amal tergantung pada niatnya.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari & Muslim', jenis: 'Hadis', tema: 'cahaya' },
  { teks: 'Orang beriman tidak jatuh ke lubang yang sama dua kali.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari & Muslim', jenis: 'Hadis', tema: 'hujan' },
  { teks: 'Barang siapa menempuh jalan untuk mencari ilmu, Allah mudahkan baginya jalan menuju surga.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Muslim', jenis: 'Hadis', tema: 'taman' },
  { teks: 'Manfaatkan lima perkara sebelum lima perkara: mudamu sebelum tuamu, sehatmu sebelum sakitmu, luangmu sebelum sibukmu.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Al-Hakim', jenis: 'Hadis', tema: 'fajar' },
  { teks: 'Permudahlah, jangan mempersulit. Berilah kabar gembira, jangan membuat orang lari.', penutur: 'Nabi Muhammad ﷺ', rujukan: 'HR. Bukhari & Muslim', jenis: 'Hadis', tema: 'taman' },
  { teks: 'Perjalanan seribu mil dimulai dari satu langkah.', penutur: 'Lao Tzu', rujukan: 'Tao Te Ching, bab 64', jenis: 'Hikmah', tema: 'gunung' },
];

// Sebar kutipan rujukan di antara yang orisinal supaya tiap hari campurannya mirip.
const DAFTAR: Kutipan[] = [];
for (let i = 0, a = 0, b = 0, n = ORISINAL.length + RUJUKAN.length; i < n; i++) {
  const giliranRujukan = Math.floor(((i + 1) * RUJUKAN.length) / n) > Math.floor((i * RUJUKAN.length) / n);
  DAFTAR.push(giliranRujukan ? RUJUKAN[a++] : ORISINAL[b++]);
}

/** Lima kutipan untuk hari ini (WIB). Hari berikutnya mengambil lima berikutnya, lalu berputar. */
export function kutipanHariIni(ms = Date.now()): Kutipan[] {
  const hari = Math.floor(Date.parse(isoTanggal(jamDinding(7, ms)) + 'T00:00:00Z') / 864e5);
  const mulai = (hari * JUMLAH_HARIAN) % DAFTAR.length;
  return Array.from({ length: JUMLAH_HARIAN }, (_, i) => DAFTAR[(mulai + i) % DAFTAR.length]);
}

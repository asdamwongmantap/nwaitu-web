# Nawaitu Web

Situs Nawaitu (Next.js 16, App Router). Alur data sama dengan aplikasi Android Nawaitu:

- **Jadwal shalat**: jadwal resmi Kemenag RI dari API [EQuran.id](https://equran.id) (`/api/v2/shalat`), untuk semua kabupaten/kota. Kota dipilih manual atau dari lokasi perangkat (reverse geocoding OpenStreetMap Nominatim).
- **Kajian**: [jadwal-kajian-indonesia-json](https://github.com/asdamwongmantap/jadwal-kajian-indonesia-json), diperbarui otomatis dua kali sehari. Jam "ba'da Maghrib" dsb. diperkirakan dari jadwal shalat wilayah kajian.
- **Artikel**: ditulis sendiri di `lib/situs.ts`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run data     # isi ulang data/ dari API sekarang juga (opsional)
```

### Arsip data (`data/`)

Data dari API disimpan sebagai JSON di `data/` (lihat `lib/arsip.ts`). Permintaan pertama mengambil dari API lalu menyimpan berkasnya; berikutnya cukup membaca berkas sampai masa berlakunya habis, lalu diambil ulang sekali. Bila API gagal, data lama tetap dipakai.

| Data | Berkas | Masa berlaku |
| --- | --- | --- |
| Daftar kab/kota | `data/wilayah.json` | 30 hari |
| Al-Qur'an per surat | `data/quran/<nomor>.json` | selamanya |
| Jadwal shalat sebulan | `data/jadwal/<tahun-bulan>/<provinsi>/<kota>.json` | 7 hari |
| Kajian | `data/kajian.json` | 6 jam |
| Masjid & sekolah Islam per petak peta (±2,8 km) | `data/tempat/<jenis>/<petak>.json` | 30 hari |

Ubah masa berlaku di `MASA_BERLAKU` (`lib/arsip.ts`). Masjid/sekolah tidak diambil sekaligus: hanya petak yang belum ada, dalam satu kueri Overpass, dan bila petak pengunjung sudah ada hasilnya langsung dikirim sementara petak lain dilengkapi di latar belakang.

Di Vercel folder ini hanya-baca saat runtime, jadi data baru hanya disimpan di memori. Jalankan situs di lokal (`npm run dev`/`npm run build`) atau `npm run data` lalu commit `data/` agar ikut ter-deploy. `npm run data -- quran` mengisi seluruh 114 surat; skrip ini butuh Node 22.18+.

## PWA dan mode offline

Situs bisa dipasang ke layar utama dan jadwal shalat serta artikel tetap terbuka saat koneksi lambat atau mati. Service worker ada di `public/sw.js` (tanpa dependensi) dan hanya aktif di build produksi; `npm run dev` justru membersihkan service worker sisa. Strategi: berkas build cache-first; halaman dan `/api/jadwal` jaringan dulu dengan batas tunggu 3,5–4 detik lalu memakai salinan tersimpan; bila belum pernah dibuka, tampil halaman `/offline/`. Halaman inti, semua artikel, dan jadwal kota pilihan pengunjung disimpan otomatis sekali sehari (`components/Pwa.tsx`).

Menguji: `npm run build && npm start`, buka di Chrome, tunggu tulisan "tersimpan untuk dipakai offline" di kaki halaman, lalu matikan server atau pilih Offline di DevTools. Naikkan `VERSI` di `public/sw.js` bila strategi cache berubah.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `lib/jadwal.ts` | Daftar wilayah dan jadwal shalat dari EQuran.id |
| `lib/arsip.ts`, `lib/equran.ts` | Arsip JSON di `data/` dengan masa berlaku; pengunduh + penyaring EQuran |
| `lib/ayat.ts` | Ayat hari ini |
| `scripts/perbarui-data.ts` | Isi ulang `data/` (`npm run data`) |
| `lib/kajian.ts`, `lib/kajian-util.ts` | Ambil dan olah data kajian (kajian rutin, acuan waktu shalat) |
| `lib/situs.ts` | Nama, tagline, tautan Play Store, dan artikel |
| `components/WidgetShalat.tsx` | Hitung mundur, progres, dan jadwal hari ini |
| `app/api/*` | Proksi untuk browser: jadwal per kota, daftar kota, lokasi |

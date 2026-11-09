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
```

## Struktur

| Lokasi | Isi |
| --- | --- |
| `lib/jadwal.ts` | Daftar wilayah dan jadwal shalat dari EQuran.id (di-cache di server) |
| `lib/kajian.ts`, `lib/kajian-util.ts` | Ambil dan olah data kajian (kajian rutin, acuan waktu shalat) |
| `lib/situs.ts` | Nama, tagline, tautan Play Store, dan artikel |
| `components/WidgetShalat.tsx` | Hitung mundur, progres, dan jadwal hari ini |
| `app/api/*` | Proksi untuk browser: jadwal per kota, daftar kota, lokasi |

## Deploy (Vercel)

Pengaturan ada di `vercel.json` (framework Next.js). Halaman memakai ISR: beranda dan kajian diperbarui tiap 6 jam, jadwal per kota tiap hari. Isi `NEXT_PUBLIC_SITE_URL` (mis. `https://nawaitu.id`) bila memakai domain sendiri; tanpa itu dipakai domain produksi Vercel.

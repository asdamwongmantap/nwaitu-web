# Panduan SEO Nawaitu

Langkah-langkah agar **www.nawaitu-ibadah.web.id** terindeks dan naik di Google. Kerjakan berurutan; bagian 1–3 cukup sekali, bagian 5–6 rutin.

| Hal | Nilai |
| --- | --- |
| Domain utama | `https://www.nawaitu-ibadah.web.id` |
| DNS dikelola di | DomaiNesia (`nsx1.domainesia.com`, `nsx2.domainesia.com`) |
| Hosting | Vercel |
| Sitemap | `https://www.nawaitu-ibadah.web.id/sitemap.xml` (otomatis, ±600 URL) |
| Robots | `https://www.nawaitu-ibadah.web.id/robots.txt` |

---

## 1. Verifikasi di Google Search Console

Buka <https://search.google.com/search-console> → **Tambahkan properti**. Pilih **salah satu** cara berikut.

### Cara A (disarankan): properti Domain + record TXT di DomaiNesia

Satu kali verifikasi langsung mencakup `www` dan non-`www`, `http` dan `https`.

1. Di Search Console pilih **Domain**, isi `nawaitu-ibadah.web.id` (tanpa `https://` dan tanpa `www`) → **Lanjutkan**.
2. Google menampilkan record seperti `google-site-verification=AbC123...`. Klik **Salin**.
3. Masuk ke **Member Area DomaiNesia** → **Domain** → pilih `nawaitu-ibadah.web.id` → **Kelola DNS / DNS Management**.
4. **Tambah record** baru:

   | Kolom | Isi |
   | --- | --- |
   | Tipe | `TXT` |
   | Nama / Host | `@` (atau kosong, artinya domain utama) |
   | Nilai / Isi | tempel `google-site-verification=AbC123...` persis dari Google |
   | TTL | biarkan bawaan (mis. 3600) |

   Jangan hapus atau ubah record `A` (`76.76.21.21`) dan `CNAME www` yang mengarah ke Vercel.
5. Simpan, tunggu 5–30 menit, lalu klik **Verifikasi** di Search Console. Bila gagal, tunggu lagi (bisa sampai beberapa jam) dan ulangi.

Cek apakah record sudah aktif:

```bash
dig +short TXT nawaitu-ibadah.web.id
```

Cara ini **tidak perlu mengubah kode** dan tidak perlu deploy.

### Cara B: properti Awalan URL + tag HTML di kode

1. Di Search Console pilih **Awalan URL**, isi `https://www.nawaitu-ibadah.web.id/`.
2. Pilih metode **Tag HTML**. Google memberi tag seperti:

   ```html
   <meta name="google-site-verification" content="AbC123..." />
   ```

3. Buka `lib/situs.ts`, tempel **hanya isi `content`** ke `verifikasiGoogle`:

   ```ts
   verifikasiGoogle: "AbC123...",
   ```

4. Commit dan deploy, lalu klik **Verifikasi**. Jangan hapus nilainya setelah terverifikasi, karena Google mengecek ulang secara berkala.

## 2. Kirim sitemap

1. Search Console → menu **Sitemap**.
2. Isi `sitemap.xml` (alamat lengkapnya `https://www.nawaitu-ibadah.web.id/sitemap.xml`) → **Kirim**.
3. Status harus **Berhasil** dengan ±600 URL ditemukan.

Sitemap dibuat otomatis oleh `app/sitemap.ts` dan diperbarui sendiri setiap hari. **Tidak perlu membuat atau mengunggah file sitemap.xml manual.** Isinya:

- beranda, `/jadwal-sholat/`, `/masjid-terdekat/`, `/kajian/`, `/artikel/`
- 518 halaman jadwal kota/kabupaten (`/jadwal-sholat/<kota>/`)
- kajian yang masih akan berlangsung (`/kajian/<slug>/`)
- semua artikel (`/artikel/<slug>/`)

Artikel baru di `lib/situs.ts` otomatis ikut masuk sitemap setelah deploy.

## 3. Rapikan domain di Vercel

1. **Redirect permanen.** Saat ini `nawaitu-ibadah.web.id` dialihkan ke `www` dengan kode **307 (sementara)**. Ubah menjadi **308 (permanen)** supaya Google memindahkan seluruh nilai SEO ke `www`:
   Vercel → project → **Settings → Domains** → `nawaitu-ibadah.web.id` → **Edit** → *Redirect to* `www.nawaitu-ibadah.web.id` → status **308 Permanent Redirect** → Save.
2. **Alamat situs.** Vercel → **Settings → Environment Variables** → tambahkan `NEXT_PUBLIC_SITE_URL` = `https://www.nawaitu-ibadah.web.id` (Production), lalu redeploy. Alamat ini dipakai untuk canonical, sitemap, dan Open Graph.
3. **Alamat `*.vercel.app`** (mis. `nwaitu-web.vercel.app`) sudah otomatis diberi `X-Robots-Tag: noindex` lewat `next.config.ts`, jadi tidak bersaing dengan domain utama. Tidak perlu tindakan.

## 4. Minta Google merayapi halaman penting

Search Console → **Inspeksi URL** → tempel alamat → **Minta pengindeksan**. Lakukan untuk (kuota ±10 per hari):

1. `https://www.nawaitu-ibadah.web.id/`
2. `https://www.nawaitu-ibadah.web.id/jadwal-sholat/`
3. `https://www.nawaitu-ibadah.web.id/jadwal-sholat/kota-jakarta/`
4. `https://www.nawaitu-ibadah.web.id/jadwal-sholat/kota-surabaya/`
5. `https://www.nawaitu-ibadah.web.id/jadwal-sholat/kota-bandung/`
6. `https://www.nawaitu-ibadah.web.id/kajian/`
7. artikel terbaru

Halaman lain akan ditemukan sendiri lewat sitemap dan tautan internal.

**Bonus: Bing dan DuckDuckGo.** Buka <https://www.bing.com/webmasters> → **Import from Google Search Console**. Situs dan sitemap langsung tersalin tanpa verifikasi ulang.

## 5. Pantau rutin (seminggu sekali)

| Menu Search Console | Yang dilihat |
| --- | --- |
| **Performa** | Kata kunci yang mendatangkan klik, CTR, posisi rata-rata. Halaman dengan tayangan tinggi tapi CTR rendah → perbaiki judul/deskripsinya. |
| **Halaman** (Pengindeksan) | Jumlah halaman terindeks. Periksa alasan di "Tidak diindeks", misalnya "Duplikat" atau "Dirayapi, belum diindeks". |
| **Data Web Inti** | Kecepatan di ponsel. Harus hijau. |
| **Breadcrumb**, **Acara** (Peningkatan) | Data terstruktur yang terbaca. Error di sini membuat breadcrumb/kajian tidak tampil kaya di hasil pencarian. |

Cek manual data terstruktur satu halaman: <https://search.google.com/test/rich-results>, mis. untuk halaman kota (Breadcrumb), artikel (Article + Breadcrumb), dan detail kajian (Event + Breadcrumb).

Hasil biasanya mulai terlihat **2–8 minggu** setelah sitemap dikirim. Jangan panik bila minggu pertama masih sepi.

## 6. Konten: pendongkrak terbesar

Jadwal sholat sudah kuat (518 halaman kota). Yang paling kurang adalah **artikel**: saat ini baru 2. Tambahkan artikel di `lib/situs.ts` (`artikel`) dengan sasaran kata kunci yang banyak dicari, misalnya:

| Kata kunci | Ide judul |
| --- | --- |
| niat sholat dhuha | Niat Sholat Dhuha, Waktu, dan Jumlah Rakaatnya |
| doa setelah sholat | Doa dan Dzikir Setelah Sholat Fardhu |
| niat puasa senin kamis | Niat Puasa Senin Kamis Beserta Artinya |
| tata cara sholat jenazah | Tata Cara Sholat Jenazah Lengkap |
| niat sholat tahajud | Niat dan Tata Cara Sholat Tahajud |
| doa qunut | Bacaan Doa Qunut Subuh dan Artinya |
| niat sholat jumat | Niat Sholat Jumat dan Sunnah-Sunnahnya |
| bacaan tahiyat akhir | Bacaan Tahiyat Awal dan Akhir |

Tips menulis:

- **Judul** memuat kata kunci di depan, maksimal ±60 karakter.
- **`ringkas`** (jadi meta description) 120–160 karakter, menjawab inti pertanyaan.
- **`slug`** pendek dan berkata kunci: `niat-sholat-dhuha`.
- Isi memakai `<h2>` per bagian, lafaz Arab, latin, dan arti; sebutkan sumber/dalil.
- Tautkan ke halaman lain di situs (jadwal sholat, artikel terkait).
- **Tinjau bersama ustadz** sebelum terbit.

Satu artikel berkualitas per minggu jauh lebih baik daripada banyak artikel tipis sekaligus.

## 7. Nama merek

Nama "Nawaitu" juga dipakai situs lain (`nawaitu.id`, platform kurban dan aqiqah), jadi pencarian "nawaitu" saja belum tentu menampilkan situs ini. Fokuslah pada kata kunci yang dicari orang ("jadwal sholat bandung", "niat sholat dhuha"), bukan nama merek. Untuk memperkuat merek:

- Cantumkan tautan situs di halaman Play Store aplikasi Nawaitu (kolom *Website*).
- Bagikan poster jadwal/ayat/kutipan (fitur bagikan sudah menyertakan tautan situs).
- Minta masjid, komunitas kajian, atau blog islami menautkan ke halaman jadwal kota mereka. Tautan dari situs lain (backlink) sangat berpengaruh pada peringkat.

---

## Ringkasan yang sudah ditangani di kode

- Judul dan deskripsi tiap halaman memuat kata kunci ("Jadwal Sholat Kota Bandung Hari Ini, November 2026").
- Canonical, `og:url`, gambar Open Graph di semua halaman (`lib/seo.ts`).
- Data terstruktur: WebSite, Organization, BreadcrumbList (URL absolut), Article, Event.
- Sitemap otomatis dengan `lastmod`, robots.txt, `noindex` untuk `*.vercel.app`.
- Tautan kota populer di beranda dan kota lain se-provinsi di tiap halaman kota.
- Dukungan tag verifikasi Google (`verifikasiGoogle` di `lib/situs.ts`).

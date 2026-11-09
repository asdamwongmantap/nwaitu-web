// Jadwal shalat satu kab/kota untuk widget di browser: bulan ini dan bulan depan, atau satu bulan
// tertentu lewat ?bulan=YYYY-MM (untuk tabel bulanan dan cetak Ramadan).
import { jadwalWilayah, wilayahDariSlug } from '@/lib/jadwal';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const wilayah = await wilayahDariSlug(slug);
    if (!wilayah) return Response.json({ galat: 'Kota tidak ditemukan' }, { status: 404 });
    const bulan = new URL(req.url).searchParams.get('bulan');
    let jadwal;
    if (bulan) {
      const m = /^(\d{4})-(\d{2})$/.exec(bulan);
      const selisih = m ? (Number(m[1]) - new Date().getUTCFullYear()) * 12 + Number(m[2]) - 1 - new Date().getUTCMonth() : NaN;
      if (!m || Number(m[2]) < 1 || Number(m[2]) > 12 || !(selisih >= -12 && selisih <= 24)) {
        return Response.json({ galat: 'Bulan tidak valid' }, { status: 400 });
      }
      jadwal = await jadwalWilayah(wilayah, 1, new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)));
      if (!Object.keys(jadwal).length) return Response.json({ galat: 'Jadwal bulan itu belum tersedia' }, { status: 404 });
    } else {
      jadwal = await jadwalWilayah(wilayah, 2);
    }
    return Response.json(
      { wilayah, jadwal },
      { headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' } },
    );
  } catch {
    return Response.json({ galat: 'Server jadwal sedang tidak dapat dihubungi' }, { status: 502 });
  }
}

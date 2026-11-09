// Jadwal shalat satu kab/kota (bulan ini dan bulan depan) untuk widget di browser.
import { jadwalWilayah, wilayahDariSlug } from '@/lib/jadwal';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const wilayah = await wilayahDariSlug(slug);
    if (!wilayah) return Response.json({ galat: 'Kota tidak ditemukan' }, { status: 404 });
    const jadwal = await jadwalWilayah(wilayah, 2);
    return Response.json(
      { wilayah, jadwal },
      { headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' } },
    );
  } catch {
    return Response.json({ galat: 'Server jadwal sedang tidak dapat dihubungi' }, { status: 502 });
  }
}

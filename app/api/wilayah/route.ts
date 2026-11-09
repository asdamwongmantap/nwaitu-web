// Daftar semua kabupaten/kota untuk pemilih kota.
import { daftarWilayah } from '@/lib/jadwal';

export async function GET() {
  try {
    const semua = await daftarWilayah();
    return Response.json(
      semua.map(({ slug, namaTampil, provinsi }) => ({ slug, namaTampil, provinsi })),
      { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } },
    );
  } catch {
    return Response.json({ galat: 'Daftar kota tidak dapat dimuat' }, { status: 502 });
  }
}

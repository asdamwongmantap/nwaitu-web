// Masjid/mushalla atau sekolah Islam di sekitar koordinat: /api/sekitar?jenis=masjid&lat=..&lng=..
import { cariSekitar, type JenisCari } from '@/lib/sekitar';

// Server Overpass publik bisa lambat (hingga ±45 detik saat sibuk).
export const maxDuration = 60;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const jenis = u.searchParams.get('jenis') as JenisCari;
  const lat = Number(u.searchParams.get('lat'));
  const lng = Number(u.searchParams.get('lng'));
  if (jenis !== 'masjid' && jenis !== 'sekolah') return Response.json({ galat: 'Jenis tidak valid' }, { status: 400 });
  // Batas kasar wilayah Indonesia.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -11.5 || lat > 6.5 || lng < 94.5 || lng > 141.5) {
    return Response.json({ galat: 'Pencarian hanya tersedia untuk wilayah Indonesia.' }, { status: 400 });
  }
  try {
    const hasil = await cariSekitar(jenis, lat, lng);
    return Response.json(hasil, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch {
    return Response.json({ galat: 'Server peta sedang sibuk. Coba lagi sebentar lagi.' }, { status: 502 });
  }
}

// Cari kab/kota dari koordinat perangkat (pengganti geocoding di aplikasi).
// Memakai Nominatim OpenStreetMap; koordinat dibulatkan dan tidak disimpan.
import { cocokkanWilayah, daftarWilayah } from '@/lib/jadwal';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get('lat'));
  const lng = Number(u.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ galat: 'Koordinat tidak valid' }, { status: 400 });
  }
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=id&lat=${lat.toFixed(3)}&lon=${lng.toFixed(3)}`,
      { headers: { 'User-Agent': 'Nawaitu-Web/2.0 (jadwal shalat)' }, next: { revalidate: 2592000 }, signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) throw new Error(String(r.status));
    const a = ((await r.json()).address ?? {}) as Record<string, string>;
    if (a.country_code && a.country_code !== 'id') {
      return Response.json({ galat: 'Jadwal hanya tersedia untuk wilayah Indonesia. Pilih kota secara manual.' }, { status: 404 });
    }
    const semua = await daftarWilayah();
    const prov = (a.state ?? '').toLowerCase().replace(/[^a-z]/g, '');
    const satuProv = semua.filter((w) => {
      const p = w.provinsi.toLowerCase().replace(/[^a-z]/g, '');
      return prov && (p.includes(prov) || prov.includes(p) || (prov.includes('jakarta') && p.includes('jakarta')) || (prov.includes('yogyakarta') && p.includes('yogyakarta')));
    });
    for (const petunjuk of [a.city, a.county, a.regency, a.municipality, a.town, a.state_district]) {
      if (!petunjuk) continue;
      const w = cocokkanWilayah(petunjuk, satuProv.length ? satuProv : semua);
      if (w) return Response.json({ slug: w.slug, nama: w.namaTampil });
    }
    return Response.json({ galat: 'Daerah Anda tidak ditemukan. Pilih kota secara manual.' }, { status: 404 });
  } catch {
    return Response.json({ galat: 'Lokasi tidak dapat dicari sekarang. Pilih kota secara manual.' }, { status: 502 });
  }
}

// Cari titik dari nama daerah (mis. "Tebet, Jakarta") untuk pengunjung yang tidak
// mengizinkan lokasi. Memakai Nominatim OpenStreetMap, dibatasi wilayah Indonesia.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 100);
  if (q.length < 3) return Response.json({ galat: 'Ketik minimal 3 huruf' }, { status: 400 });
  try {
    const u = new URL('https://nominatim.openstreetmap.org/search');
    Object.entries({ q, format: 'jsonv2', countrycodes: 'id', limit: '5', 'accept-language': 'id' }).forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u, {
      headers: { 'User-Agent': 'Nawaitu-Web/2.0 (masjid dan sekolah islam terdekat)' },
      next: { revalidate: 2592000 },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(String(r.status));
    const hasil = ((await r.json()) as { display_name?: string; lat?: string; lon?: string }[])
      .filter((x) => x.display_name && x.lat && x.lon)
      .map((x) => ({ nama: x.display_name!, lat: Number(x.lat), lng: Number(x.lon) }));
    return Response.json({ hasil });
  } catch {
    return Response.json({ galat: 'Pencarian daerah sedang tidak tersedia. Coba lagi nanti.' }, { status: 502 });
  }
}

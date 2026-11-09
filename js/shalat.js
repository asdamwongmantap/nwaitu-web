// Perhitungan waktu sholat dari koordinat. Dipakai di browser (hitung mundur dan tabel).
// Hasil: menit sejak 00:00 waktu setempat. Perkiraan, bisa beda 1-3 menit dari jadwal Kemenag.
const Shalat = (() => {
  const R = Math.PI / 180;
  const sin = (d) => Math.sin(d * R), cos = (d) => Math.cos(d * R), tan = (d) => Math.tan(d * R);
  const asin = (x) => Math.asin(x) / R, acos = (x) => Math.acos(x) / R;
  const atan2 = (y, x) => Math.atan2(y, x) / R;
  const fixA = (a) => ((a % 360) + 360) % 360, fixH = (h) => ((h % 24) + 24) % 24;

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  // Deklinasi matahari dan persamaan waktu pada hari Julian jd.
  function posisiMatahari(jd) {
    const D = jd - 2451545, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
    const L = fixA(q + 1.915 * sin(g) + 0.02 * sin(2 * g)), e = 23.439 - 0.00000036 * D;
    const ra = fixH(atan2(cos(e) * sin(L), cos(L)) / 15);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - ra };
  }

  function hitung(y, m, d, lat, lng, tz) {
    const jd = julian(y, m, d) - lng / (15 * 24);
    const pos = (t) => posisiMatahari(jd + t);
    const tengahHari = (t) => fixH(12 - pos(t).eqt);
    const sudut = (ang, t, sebelum) => {
      const D = pos(t).decl;
      const v = acos((-sin(ang) - sin(D) * sin(lat)) / (cos(D) * cos(lat))) / 15;
      return tengahHari(t) + (sebelum ? -v : v);
    };
    const ashar = (t) => sudut(-atan2(1, 1 + tan(Math.abs(lat - pos(t).decl))), t, false);
    const zona = (jam) => (jam + tz - lng / 15) * 60; // ke menit waktu setempat
    const bulat = Math.round;
    return {
      Subuh: bulat(zona(sudut(20, 5 / 24, true)) + 2),
      Terbit: bulat(zona(sudut(0.833, 6 / 24, true)) - 2),
      Dzuhur: bulat(zona(tengahHari(0.5)) + 2),
      Ashar: bulat(zona(ashar(15 / 24)) + 2),
      Maghrib: bulat(zona(sudut(0.833, 18 / 24, false)) + 2),
      Isya: bulat(zona(sudut(18, 19 / 24, false)) + 2),
    };
  }

  return { hitung };
})();

if (typeof module !== 'undefined') module.exports = Shalat;
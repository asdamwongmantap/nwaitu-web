// Kode di browser: hitung mundur, tabel jadwal, filter kajian. Butuh data.js dan shalat.js dimuat lebih dulu.
(() => {
  const body = document.body;
  const BASE = body.dataset.base || '';
  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const WAKTU = ['Subuh', 'Terbit', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const WAJIB = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  const simpan = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const baca = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  let slug = body.dataset.kota || baca('nawaitu_kota') || 'jakarta';
  const kota = () => DATA.kota.find((k) => k.slug === slug) || DATA.kota[0];
  const sekarangDi = (tz) => new Date(Date.now() + tz * 3600e3); // jam dinding kota, dibaca dengan getUTC*
  const jadwalHari = (k, d) => Shalat.hitung(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), k.lat, k.lng, k.tz);

  function tanggalHijriah(d) {
    try {
      return new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    } catch (e) { return ''; }
  }

  function kotakWaktu(j, menit, next) {
    return WAKTU.map((n) => {
      const cls = n === next ? 'w next' : j[n] <= menit ? 'w lewat' : 'w';
      return `<div class="${cls}"><span>${n}</span><b>${fmt(j[n])}</b></div>`;
    }).join('');
  }

  function tick() {
    const k = kota();
    const now = sekarangDi(k.tz);
    const j = jadwalHari(k, now);
    const menit = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
    let next = WAJIB.find((n) => j[n] > menit);
    let target = next ? j[next] : null;
    if (!next) { // sudah lewat Isya: hitung ke Subuh besok
      target = jadwalHari(k, new Date(now.getTime() + 864e5)).Subuh + 1440;
      next = 'Subuh';
    }
    const sebelum = WAJIB.filter((n) => j[n] <= menit).pop();
    const mulai = sebelum ? j[sebelum] : jadwalHari(k, new Date(now.getTime() - 864e5)).Isya - 1440;
    const nSebelum = sebelum || 'Isya';
    const persen = Math.min(100, Math.max(0, ((menit - mulai) / (target - mulai)) * 100));
    const sisa = Math.max(0, Math.round((target - menit) * 60));
    $('#nama-next').textContent = next;
    $('#hitung').textContent = `${pad(Math.floor(sisa / 3600))}:${pad(Math.floor((sisa % 3600) / 60))}:${pad(sisa % 60)}`;
    $('#progres').style.width = `${persen.toFixed(1)}%`;
    $('#prog-kiri').textContent = `${nSebelum} ${fmt(((mulai % 1440) + 1440) % 1440)}`;
    $('#prog-kanan').textContent = `${next} ${fmt(target % 1440)}`;
    $('#jam-next').textContent = `Pukul ${fmt(target % 1440)} ${k.zona} di ${k.nama}`;
    $('#tanggal').textContent = `${HARI[now.getUTCDay()]}, ${now.getUTCDate()} ${BULAN[now.getUTCMonth()]} ${now.getUTCFullYear()} · ${tanggalHijriah(now)}`;
    const kotak = $('#waktu-hari');
    if (kotak) kotak.innerHTML = kotakWaktu(j, menit, next);
  }

  function tabel7() {
    const tb = $('#tabel7 tbody');
    if (!tb) return;
    const k = kota();
    const now = sekarangDi(k.tz);
    tb.innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() + i * 864e5);
      const j = jadwalHari(k, d);
      return `<tr class="${i === 0 ? 'hari-ini' : ''}"><td>${HARI[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()].slice(0, 3)}</td>${WAKTU.map((n) => `<td>${fmt(j[n])}</td>`).join('')}</tr>`;
    }).join('');
  }

  function pilihKota() {
    const sel = $('#kota');
    if (!sel) return;
    sel.innerHTML = DATA.kota.map((k) => `<option value="${k.slug}">${k.nama}</option>`).join('');
    sel.value = kota().slug;
    sel.addEventListener('change', () => {
      simpan('nawaitu_kota', sel.value);
      if (body.dataset.mode === 'kota') { location.href = `${BASE}/jadwal-sholat/${sel.value}/`; return; }
      slug = sel.value;
      tick();
    });
  }

  // Sembunyikan kajian yang tanggalnya sudah lewat (berlaku walau halaman dibuat kemarin).
  function kajian() {
    const hariIni = sekarangDi(7).toISOString().slice(0, 10);
    const kartu = [...document.querySelectorAll('[data-tanggal]')];
    kartu.forEach((c) => { c.hidden = c.dataset.tanggal < hariIni; });
    document.querySelectorAll('.chip[data-f]').forEach((b) =>
      b.addEventListener('click', () => {
        document.querySelectorAll('.chip[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        kartu.forEach((c) => { c.hidden = c.dataset.tanggal < hariIni || (b.dataset.f !== 'semua' && c.dataset.kota !== b.dataset.f); });
      }));
  }

  pilihKota();
  if ($('#hitung')) { tick(); setInterval(tick, 1000); }
  tabel7();
  kajian();
})();
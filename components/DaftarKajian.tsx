'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { DataKajian } from '@/lib/kajian';
import { berikutnya, kapan, keteranganJam, labelMode, labelPeserta, type Kajian } from '@/lib/kajian-util';
import { bacaSimpanan } from './WidgetShalat';

type Rentang = 'hari' | 'pekan' | 'semua';
const KUNCI = 'nawaitu_kajian_wilayah';

export function KartuKajian({ k, iso, berlangsung, keterangan, sekarang }: { k: Kajian; iso: string; berlangsung: boolean; keterangan: string; sekarang: number }) {
  const mode = labelMode(k.mode);
  const peserta = labelPeserta(k.peserta);
  return (
    <Link className="card kartu-kajian" href={`/kajian/${k.slug}/`}>
      <div className="lencana">
        {berlangsung && <span className="tag mulai">Sedang berlangsung</span>}
        <span className="tag waktu-tag">
          {kapan(iso, sekarang, k.zona)} · {keterangan}
        </span>
        {mode && <span className="tag">{mode}</span>}
        {peserta && <span className="tag">{peserta}</span>}
        {k.tanggalPerkiraan && <span className="tag emas">Tanggal perkiraan</span>}
      </div>
      <h3>{k.judul}</h3>
      {k.subJudul && <p className="sub-judul">{k.subJudul}</p>}
      {k.ustadz.length > 0 && <div className="ustadz">{k.ustadz.join(', ')}</div>}
      <div className="tempat">
        {k.tempat}
        {k.kabkota ? ` · ${k.kabkota.replace(/^Kota Administrasi /, '')}` : ''}
      </div>
    </Link>
  );
}

export default function DaftarKajian({
  data,
  dibuatHalaman,
  batas,
  ringkas = false,
}: {
  data: DataKajian;
  dibuatHalaman: number;
  batas?: number;
  ringkas?: boolean;
}) {
  const [now, setNow] = useState(dibuatHalaman);
  const [wilayah, setWilayah] = useState('semua');
  const [kotaSaya, setKotaSaya] = useState<string | null>(null);
  const [rentang, setRentang] = useState<Rentang>(ringkas ? 'semua' : 'pekan');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    const kota = bacaSimpanan();
    const adaKajian = kota && data.kajian.some((k) => k.jadwalSlug === kota);
    if (adaKajian) setKotaSaya(kota);
    if (ringkas) return () => clearInterval(t);
    let simpanan: string | null = null;
    try {
      simpanan = localStorage.getItem(KUNCI);
    } catch {}
    if (simpanan && (simpanan === 'semua' || data.wilayah.some((w) => w.slug === simpanan) || simpanan === `kota:${kota}`)) {
      if (!simpanan.startsWith('kota:') || adaKajian) setWilayah(simpanan);
    } else if (adaKajian) setWilayah(`kota:${kota}`);
    return () => clearInterval(t);
  }, [data, ringkas]);

  function ubahWilayah(v: string) {
    setWilayah(v);
    try {
      localStorage.setItem(KUNCI, v);
    } catch {}
  }

  const namaKotaSaya = useMemo(() => {
    const k = data.kajian.find((x) => x.jadwalSlug === kotaSaya);
    return k?.kabkota?.replace(/^Kota Administrasi /, 'Kota ') ?? null;
  }, [data, kotaSaya]);

  const item = useMemo(() => {
    const hariIni = new Date(now + 7 * 3600e3);
    const akhir = rentang === 'hari' ? 1 : rentang === 'pekan' ? 7 : null;
    const batasMs = akhir == null ? Infinity : Date.UTC(hariIni.getUTCFullYear(), hariIni.getUTCMonth(), hariIni.getUTCDate() + akhir) - 7 * 3600e3;
    const hasil: { k: Kajian; iso: string; ms: number; ket: string; berlangsung: boolean }[] = [];
    for (const k of data.kajian) {
      const cocok =
        wilayah === 'semua' ||
        (wilayah.startsWith('kota:') ? k.jadwalSlug === wilayah.slice(5) : k.wilayah === wilayah) ||
        (online && k.mode === 'online');
      if (!cocok) continue;
      const j = berikutnya(k, now, data.acuan);
      if (!j || j.ms >= batasMs) continue;
      hasil.push({ k, iso: j.iso, ms: j.ms, ket: keteranganJam(k, j), berlangsung: j.menit != null && j.ms <= now });
    }
    // Ringkasan beranda: kajian di kota pengunjung didahulukan.
    const dekat = (k: Kajian) => (ringkas && kotaSaya && k.jadwalSlug === kotaSaya ? 0 : 1);
    hasil.sort((a, b) => dekat(a.k) - dekat(b.k) || a.ms - b.ms);
    return batas ? hasil.slice(0, batas) : hasil;
  }, [data, now, wilayah, rentang, online, batas, ringkas, kotaSaya]);

  return (
    <>
      {!ringkas && (
        <div className="saring">
          <div className="baris">
            <label className="sr-only" htmlFor="pilih-wilayah">
              Wilayah
            </label>
            <select id="pilih-wilayah" value={wilayah} onChange={(e) => ubahWilayah(e.target.value)}>
              <option value="semua">Semua wilayah ({data.wilayah.length})</option>
              {kotaSaya && namaKotaSaya && <option value={`kota:${kotaSaya}`}>Sekitar {namaKotaSaya} (kota Anda)</option>}
              {data.wilayah.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.nama}
                </option>
              ))}
            </select>
            {wilayah !== 'semua' && (
              <label className="centang">
                <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
                Sertakan kajian online
              </label>
            )}
          </div>
          <div className="chips" role="group" aria-label="Rentang waktu" style={{ margin: 0 }}>
            {(
              [
                ['hari', 'Hari ini'],
                ['pekan', '7 hari'],
                ['semua', 'Semua'],
              ] as const
            ).map(([v, n]) => (
              <button key={v} className="chip" type="button" aria-pressed={rentang === v} onClick={() => setRentang(v)}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      {item.length ? (
        <div className="grid">
          {item.map((e) => (
            <KartuKajian key={e.k.id} k={e.k} iso={e.iso} berlangsung={e.berlangsung} keterangan={e.ket} sekarang={now} />
          ))}
        </div>
      ) : (
        <div className="kosong">
          <b>Belum ada kajian yang cocok</b>
          {ringkas
            ? 'Belum ada kajian terjadwal dalam waktu dekat.'
            : rentang !== 'semua'
              ? 'Coba pilih "Semua" atau ganti wilayah.'
              : 'Wilayah ini belum punya jadwal kajian. Coba wilayah lain.'}
        </div>
      )}
    </>
  );
}

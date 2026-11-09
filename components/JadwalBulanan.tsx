'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BULAN, ramadanBerikutnya, tambahHari, type JadwalHari } from '@/lib/waktu';
import TabelBulan from './TabelBulan';

type Props = {
  slug: string;
  nama: string;
  provinsi: string;
  zona: string;
  tz: number;
  hariIni: string; // ISO, dari server
  awal: Record<string, JadwalHari>; // jadwal bulan ini dan bulan depan dari server
};

type Mode = { jenis: 'bulan'; bulan: string } | { jenis: 'ramadan' };

const geser = (bulan: string, n: number) => {
  const [y, m] = bulan.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const namaBulan = (bulan: string) => `${BULAN[Number(bulan.slice(5)) - 1]} ${bulan.slice(0, 4)}`;

// Tabel jadwal sebulan dengan pilihan bulan, jadwal imsakiyah Ramadan, dan tombol cetak.
export default function JadwalBulanan({ slug, nama, provinsi, zona, tz, hariIni, awal }: Props) {
  const bulanIni = hariIni.slice(0, 7);
  const [mode, setMode] = useState<Mode>({ jenis: 'bulan', bulan: bulanIni });
  const [data, setData] = useState(awal);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [ramadan, setRamadan] = useState<ReturnType<typeof ramadanBerikutnya>>(null);
  const [host, setHost] = useState('');
  useEffect(() => setHost(location.host), []);

  // Dihitung di browser agar sama dengan Intl perangkat dan tidak memicu beda hidrasi.
  useEffect(() => setRamadan(ramadanBerikutnya(hariIni)), [hariIni]);

  const pastikan = useCallback(
    async (bulanList: string[]) => {
      const ada = new Set(Object.keys(data).map((k) => k.slice(0, 7)));
      const kurang = bulanList.filter((b) => !ada.has(b));
      if (!kurang.length) return true;
      setMemuat(true);
      setGalat(null);
      try {
        const hasil = await Promise.all(
          kurang.map(async (b) => {
            const res = await fetch(`/api/jadwal/${slug}?bulan=${b}`);
            const j = await res.json();
            if (!res.ok) throw new Error(j.galat || 'Jadwal belum tersedia');
            return j.jadwal as Record<string, JadwalHari>;
          }),
        );
        setData((d) => Object.assign({}, d, ...hasil));
        return true;
      } catch (e) {
        setGalat((e as Error).message);
        return false;
      } finally {
        setMemuat(false);
      }
    },
    [data, slug],
  );

  async function pilihBulan(bulan: string) {
    if (await pastikan([bulan])) setMode({ jenis: 'bulan', bulan });
  }
  async function pilihRamadan() {
    if (!ramadan) return;
    if (await pastikan([ramadan.mulai.slice(0, 7), ramadan.selesai.slice(0, 7)])) setMode({ jenis: 'ramadan' });
  }

  const { baris, judul } = useMemo(() => {
    if (mode.jenis === 'ramadan' && ramadan) {
      const iso: string[] = [];
      for (let d = ramadan.mulai; d <= ramadan.selesai; d = tambahHari(d, 1)) iso.push(d);
      return {
        baris: iso.filter((d) => data[d]).map((d) => [d, data[d]] as [string, JadwalHari]),
        judul: `Jadwal Imsakiyah Ramadan ${ramadan.tahun} H`,
      };
    }
    const bulan = mode.jenis === 'bulan' ? mode.bulan : bulanIni;
    return {
      baris: Object.entries(data).filter(([d]) => d.startsWith(bulan)).sort(([a], [b]) => a.localeCompare(b)),
      judul: `Jadwal ${namaBulan(bulan)}`,
    };
  }, [mode, data, ramadan, bulanIni]);

  const bulanAktif = mode.jenis === 'bulan' ? mode.bulan : null;
  const rentangRamadan = ramadan
    ? `${ramadan.mulai.slice(8).replace(/^0/, '')} ${BULAN[Number(ramadan.mulai.slice(5, 7)) - 1]} sampai ${ramadan.selesai.slice(8).replace(/^0/, '')} ${BULAN[Number(ramadan.selesai.slice(5, 7)) - 1]} ${ramadan.selesai.slice(0, 4)}`
    : '';

  return (
    <section aria-labelledby="judul-bulanan">
      <div className="kepala-bagian">
        <h2 id="judul-bulanan">
          {judul} <span className="muted">· {nama}, {provinsi}</span>
        </h2>
      </div>
      <div className="alat-jadwal">
        <div className="baris">
          <button className="chip" type="button" disabled={!bulanAktif || memuat} onClick={() => bulanAktif && pilihBulan(geser(bulanAktif, -1))} aria-label="Bulan sebelumnya">
            ‹
          </button>
          <button className="chip" type="button" aria-pressed={bulanAktif === bulanIni} onClick={() => pilihBulan(bulanIni)}>
            Bulan ini
          </button>
          <button className="chip" type="button" disabled={!bulanAktif || memuat} onClick={() => bulanAktif && pilihBulan(geser(bulanAktif, 1))} aria-label="Bulan berikutnya">
            ›
          </button>
          {ramadan && (
            <button className="chip" type="button" aria-pressed={mode.jenis === 'ramadan'} onClick={pilihRamadan} disabled={memuat}>
              Ramadan {ramadan.tahun} H
            </button>
          )}
          <button className="chip ikon cetak" type="button" onClick={() => window.print()} disabled={memuat || !baris.length}>
            <IkonCetak />
            Cetak
          </button>
        </div>
        {memuat && <p className="muted kecil" role="status">Memuat jadwal…</p>}
        {galat && <p className="galat-teks kecil" role="alert">{galat}. Jadwal bulan yang jauh biasanya baru tersedia mendekati waktunya.</p>}
      </div>

      <div className="cetak-kepala">
        <div className="cetak-merek">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="" width={34} height={44} />
          <div>
            <b>Nawaitu</b>
            <span>Teman ibadah harian Anda</span>
          </div>
        </div>
        <div className="cetak-judul">
          <small>{mode.jenis === 'ramadan' && ramadan ? `Jadwal Imsakiyah Ramadan ${ramadan.tahun} H` : 'Jadwal Shalat'}</small>
          <strong>{nama}</strong>
          <span>
            {provinsi} · {mode.jenis === 'ramadan' && rentangRamadan ? rentangRamadan : namaBulan(mode.jenis === 'bulan' ? mode.bulan : bulanIni)} · {zona}
          </span>
        </div>
      </div>
      <TabelBulan baris={baris} tz={tz} nomor={mode.jenis === 'ramadan' ? 'Ramadan ke-' : undefined} />
      {mode.jenis === 'ramadan' && (
        <div className="catatan">
          Awal Ramadan mengikuti kalender Umm al-Qura dan bisa berbeda satu hari dari penetapan sidang isbat Kemenag. Cek
          pengumuman resmi dan sesuaikan tanggal pada hasil cetak bila perlu.
        </div>
      )}
      <div className="cetak-kaki">
        <div>
          <span className="legenda" /> Hari Jumat · Sumber: Kemenag RI (Bimas Islam) via EQuran.id · Waktu {zona}.
          <br />
          Waktu di masjid setempat bisa berbeda beberapa menit; ikuti jadwal masjid Anda.
        </div>
        <div className="host">{host}</div>
      </div>
    </section>
  );
}

const IkonCetak = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" />
    <rect x="6" y="14" width="12" height="7" rx="1" />
  </svg>
);

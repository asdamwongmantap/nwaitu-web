'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Wilayah } from '@/lib/jadwal';
import {
  LABEL, TAMPIL, WAJIB, fmtMenit, isoTanggal, jamDinding, menitDari, pad, tambahHari,
  tanggalHijriah, tanggalPanjang, type JadwalHari, type Waktu,
} from '@/lib/waktu';
import { IkonWaktu } from './Ikon';
import PilihWilayah, { IkonPin } from './PilihWilayah';
import TombolPoster from './TombolPoster';

export type DataJadwal = { wilayah: Wilayah; jadwal: Record<string, JadwalHari> };
export const KUNCI_SIMPAN = 'nawaitu_wilayah';

export function bacaSimpanan() {
  try {
    return localStorage.getItem(KUNCI_SIMPAN);
  } catch {
    return null;
  }
}
function simpan(slug: string) {
  try {
    localStorage.setItem(KUNCI_SIMPAN, slug);
  } catch {}
}

type Hitung = {
  next: Waktu;
  sisaDetik: number;
  persen: number;
  sebelum: { nama: Waktu; jam: string };
  jamNext: string;
};

function hitung(j: JadwalHari, kemarin: JadwalHari | undefined, besok: JadwalHari | undefined, menit: number): Hitung | null {
  let next = WAJIB.find((w) => menitDari(j[w]) > menit);
  let target: number;
  if (next) target = menitDari(j[next]);
  else {
    if (!besok) return null;
    next = 'subuh';
    target = menitDari(besok.subuh) + 1440;
  }
  const lalu = WAJIB.filter((w) => menitDari(j[w]) <= menit).pop();
  const mulai = lalu ? menitDari(j[lalu]) : menitDari((kemarin ?? j).isya) - 1440;
  return {
    next,
    sisaDetik: Math.max(0, Math.round((target - menit) * 60)),
    persen: Math.min(100, Math.max(0, ((menit - mulai) / (target - mulai)) * 100)),
    sebelum: { nama: lalu ?? 'isya', jam: fmtMenit(((mulai % 1440) + 1440) % 1440) },
    jamNext: fmtMenit(target % 1440),
  };
}

export default function WidgetShalat({
  awal,
  hariIniAwal,
  judul,
  tetap = false,
  tumpuk = false,
}: {
  awal: DataJadwal | null;
  hariIniAwal: string; // tanggal saat halaman dibuat, dipakai sampai jam browser terbaca
  judul?: ReactNode;
  tetap?: boolean; // halaman satu kota: pilihan kota pindah halaman
  tumpuk?: boolean; // beri ruang di bawah banner agar kartu berikutnya menumpuk di tepinya
}) {
  const router = useRouter();
  const [data, setData] = useState(awal);
  const [now, setNow] = useState<number | null>(null);
  const [galat, setGalat] = useState<string | null>(awal ? null : 'Jadwal belum bisa dimuat.');
  const [memuat, setMemuat] = useState(false);
  const [buka, setBuka] = useState(false);

  const muat = useCallback(async (slug: string) => {
    setMemuat(true);
    try {
      const r = await fetch(`/api/jadwal/${slug}/`);
      if (!r.ok) throw new Error(String(r.status));
      setData(await r.json());
      setGalat(null);
    } catch {
      setGalat('Jadwal kota ini belum bisa dimuat. Coba lagi sebentar lagi.');
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    if (!tetap) {
      const s = bacaSimpanan();
      if (s && s !== awal?.wilayah.slug) muat(s);
      else if (!awal) muat(s || 'kota-jakarta');
    }
    return () => clearInterval(t);
  }, [tetap, awal, muat]);

  const pilih = useCallback(
    (slug: string) => {
      setBuka(false);
      simpan(slug);
      if (tetap) router.push(`/jadwal-sholat/${slug}/`);
      else muat(slug);
    },
    [tetap, router, muat],
  );
  const tutup = useCallback(() => setBuka(false), []);

  const w = data?.wilayah;
  const d = w && now != null ? jamDinding(w.tz, now) : null;
  const iso = d ? isoTanggal(d) : hariIniAwal;
  const j = data?.jadwal[iso];
  const menit = d ? d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 : null;
  const h = j && menit != null ? hitung(j, data?.jadwal[tambahHari(iso, -1)], data?.jadwal[tambahHari(iso, 1)], menit) : null;
  const sisa = h ? `${pad(Math.floor(h.sisaDetik / 3600))}:${pad(Math.floor((h.sisaDetik % 3600) / 60))}:${pad(h.sisaDetik % 60)}` : '--:--:--';

  return (
    <>
      <section className={tumpuk ? 'hero tumpuk' : 'hero'}>
        <div className="wrap">
          <div className="hero-grid">
            <div>
              {judul}
              <div className="tanggal-hero">
                {tanggalPanjang(iso)}
                {tanggalHijriah(iso) && <span> · {tanggalHijriah(iso)}</span>}
              </div>
              <div className="label kiri-label">Waktu shalat berikutnya</div>
              <div className="nama-next">
                {h ? LABEL[h.next] : '…'}
                {h && (
                  <span className="jam-next">
                    {h.jamNext}
                    {w && <small>{w.zona}</small>}
                  </span>
                )}
              </div>
              <div className="lokasi">
                <button className="tombol-lokasi" type="button" onClick={() => setBuka(true)} aria-haspopup="dialog">
                  <IkonPin />
                  {w ? `${w.namaTampil}` : 'Pilih kota'}
                  <span aria-hidden="true">▾</span>
                </button>
                {!tetap && w && (
                  <Link className="tombol-lokasi redup" href={`/jadwal-sholat/${w.slug}/`}>
                    Jadwal sebulan →
                  </Link>
                )}
              </div>
            </div>
            <div className="kartu-hitung" aria-live="off">
              <div className="kh-baris">
                {/* Hanya tampil di ponsel; di layar lebar nama waktu berikutnya ada di kolom kiri. */}
                <div className="kh-next">
                  <div className="label">Berikutnya</div>
                  <div className="kh-nama">
                    {h ? LABEL[h.next] : '…'}
                    {h && <small>{h.jamNext}</small>}
                  </div>
                </div>
                <div className="kh-sisa">
                  <div className="label">Tersisa</div>
                  <div className="count">{memuat ? '…' : sisa}</div>
                </div>
              </div>
              <div className="progres" aria-hidden="true">
                <span style={{ width: `${h ? h.persen.toFixed(1) : 0}%` }} />
              </div>
              <div className="progres-ket">
                <span>{h ? `${LABEL[h.sebelum.nama]} ${h.sebelum.jam}` : ''}</span>
                <span>{h ? `${LABEL[h.next]} ${h.jamNext}` : ''}</span>
              </div>
              {galat ? (
                <div className="sub">
                  <span className="galat">{galat}</span>
                </div>
              ) : w && now != null && !j ? (
                <div className="sub">
                  <span className="galat">Jadwal hari ini belum tersedia.</span>
                </div>
              ) : null}
            </div>
          </div>

          <section className="hero-jadwal" aria-labelledby="judul-hari-ini">
            <div className="hero-jadwal-kepala">
              <h2 id="judul-hari-ini">
                Jadwal hari ini{w ? <span> · {w.namaTampil} ({w.zona})</span> : null}
              </h2>
              {w && j && (
                <TombolPoster
                  className="chip ikon pada-hijau"
                  label="Bagikan jadwal"
                  isi={{
                    jenis: 'sholat',
                    kota: w.namaTampil,
                    provinsi: w.provinsi,
                    zona: w.zona,
                    tanggal: tanggalPanjang(iso),
                    hijriah: tanggalHijriah(iso),
                    jadwal: j,
                    path: `/jadwal-sholat/${w.slug}/`,
                  }}
                />
              )}
            </div>
            <div className="waktu">
              {TAMPIL.map((k) => {
                const lewat = j && menit != null && menitDari(j[k]) <= menit && k !== h?.next;
                const cls = k === h?.next ? 'w next' : lewat ? 'w lewat' : 'w';
                return (
                  <div key={k} className={cls} aria-current={k === h?.next ? 'time' : undefined}>
                    <span className="w-ikon">
                      <IkonWaktu k={k} />
                    </span>
                    <span className="w-nama">{LABEL[k]}</span>
                    <b>{j ? j[k] : '--:--'}</b>
                  </div>
                );
              })}
            </div>
            {j && (
              <div className="info-waktu">
                <span>
                  Imsak <b>{j.imsak}</b>
                </span>
                <span>
                  Dhuha <b>{j.dhuha}</b>
                </span>
                <span>Sumber: Kemenag RI via EQuran.id</span>
              </div>
            )}
          </section>
        </div>
      </section>
      <noscript>
        <div className="wrap catatan">Aktifkan JavaScript untuk melihat hitung mundur waktu shalat.</div>
      </noscript>
      {buka && <PilihWilayah aktif={w?.slug} onPilih={pilih} onTutup={tutup} />}
    </>
  );
}

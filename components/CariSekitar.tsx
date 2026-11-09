'use client';
import { useEffect, useState } from 'react';
import { IkonCari, IkonMasjid, IkonSekolah } from './Ikon';
import { IkonPin } from './PilihWilayah';

type Jenis = 'masjid' | 'sekolah';
type Tempat = { id: string; nama: string; jenis: string; lat: number; lng: number; alamat: string | null };
type Titik = { lat: number; lng: number; label: string };

const LANGKAH = 12; // jumlah kartu per tampilan; sisanya lewat tombol "Tampilkan lebih banyak"

const JENIS: { id: Jenis; label: string; kosong: string }[] = [
  { id: 'masjid', label: 'Masjid & mushalla', kosong: 'masjid atau mushalla' },
  { id: 'sekolah', label: 'Sekolah Islam', kosong: 'sekolah Islam, madrasah, atau pesantren' },
];

function jarakKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
const fmtJarak = (km: number) => (km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km.toFixed(1).replace('.', ',')} km`);

// Pencarian masjid/mushalla dan sekolah Islam terdekat dari lokasi perangkat atau nama daerah.
export default function CariSekitar() {
  const [jenis, setJenis] = useState<Jenis>('masjid');
  const [titik, setTitik] = useState<Titik | null>(null);
  const [hasil, setHasil] = useState<Tempat[] | null>(null);
  const [cadangan, setCadangan] = useState(false);
  const [memuat, setMemuat] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [saran, setSaran] = useState<{ nama: string; lat: number; lng: number }[] | null>(null);
  const [jumlah, setJumlah] = useState(LANGKAH);

  useEffect(() => {
    if (!titik) return;
    let batal = false;
    setMemuat(jenis === 'masjid' ? 'Mencari masjid dan mushalla di sekitar…' : 'Mencari sekolah Islam di sekitar…');
    setGalat(null);
    setHasil(null);
    // Kirim koordinat dibulatkan (±100 m); server membulatkan lagi sebelum bertanya ke layanan peta.
    fetch(`/api/sekitar?jenis=${jenis}&lat=${titik.lat.toFixed(3)}&lng=${titik.lng.toFixed(3)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.galat || 'Pencarian gagal');
        return j as { tempat: Tempat[]; sumber: string };
      })
      .then((j) => {
        if (batal) return;
        setHasil([...j.tempat].sort((a, b) => jarakKm(titik, a) - jarakKm(titik, b)));
        setCadangan(j.sumber !== 'overpass');
      })
      .catch((e) => !batal && setGalat((e as Error).message))
      .finally(() => !batal && setMemuat(null));
    return () => {
      batal = true;
    };
  }, [jenis, titik]);

  useEffect(() => setJumlah(LANGKAH), [hasil]);

  function lokasiSaya() {
    setSaran(null);
    if (!('geolocation' in navigator)) return setGalat('Peramban ini tidak mendukung lokasi. Cari nama daerah Anda.');
    setMemuat('Membaca lokasi perangkat…');
    setGalat(null);
    navigator.geolocation.getCurrentPosition(
      (p) => setTitik({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Lokasi Anda' }),
      (e) => {
        setMemuat(null);
        setGalat(e.code === 1 ? 'Izin lokasi ditolak. Cari nama daerah Anda di kolom di bawah.' : 'Lokasi tidak dapat dibaca. Cari nama daerah Anda.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  }

  async function cariDaerah(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3) return setGalat('Ketik minimal 3 huruf nama daerah.');
    setGalat(null);
    setMemuat('Mencari daerah…');
    try {
      const r = await fetch(`/api/cari-tempat?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.galat || 'Pencarian gagal');
      setSaran(j.hasil);
      if (!j.hasil.length) setGalat(`Daerah “${q.trim()}” tidak ditemukan. Coba tambahkan nama kota, mis. “Tebet, Jakarta”.`);
    } catch (err) {
      setGalat((err as Error).message);
    } finally {
      setMemuat(null);
    }
  }

  const label = JENIS.find((x) => x.id === jenis)!;

  const IkonJenis = jenis === 'masjid' ? IkonMasjid : IkonSekolah;

  return (
    <>
      <div className="saring alat-melayang panel-cari">
        <div className="segmen" role="group" aria-label="Jenis tempat">
          {JENIS.map((x) => (
            <button key={x.id} type="button" aria-pressed={jenis === x.id} onClick={() => setJenis(x.id)}>
              {x.id === 'masjid' ? <IkonMasjid /> : <IkonSekolah />}
              {x.label}
            </button>
          ))}
        </div>
        <div className="cari-baris">
          <button className="tombol" type="button" onClick={lokasiSaya}>
            <IkonPin />
            Gunakan lokasi saya
          </button>
          <span className="atau">atau</span>
          <form className="kolom-cari" onSubmit={cariDaerah}>
            <span className="ikon-cari">
              <IkonCari />
            </span>
            <input className="cari" type="search" placeholder="Nama daerah, mis. Tebet, Jakarta" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari daerah" />
            <button className="tombol" type="submit">
              Cari
            </button>
          </form>
        </div>
        {saran && saran.length > 0 && (
          <div className="saran" role="list">
            {saran.map((s) => (
              <button
                key={`${s.lat},${s.lng}`}
                role="listitem"
                type="button"
                onClick={() => {
                  setTitik({ lat: s.lat, lng: s.lng, label: s.nama.split(',').slice(0, 2).join(',') });
                  setSaran(null);
                }}
              >
                <IkonPin />
                {s.nama}
              </button>
            ))}
          </div>
        )}
      </div>

      {galat && (
        <div className="kosong" role="alert">
          <b>Belum bisa menampilkan hasil</b>
          {galat}
        </div>
      )}

      {memuat && (
        <>
          <p className="muted status-muat" role="status">
            {memuat}
          </p>
          {titik && (
            <div className="grid daftar-sekitar" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card tempat rangka">
                  <div className="tempat-atas">
                    <i style={{ width: 40, height: 40, borderRadius: 12 }} />
                    <i style={{ width: 64 }} />
                  </div>
                  <i style={{ width: '75%', height: 16 }} />
                  <i style={{ width: '45%' }} />
                  <i style={{ width: '90%' }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!titik && !memuat && !galat && (
        <div className="kosong-ilustrasi">
          <div className="kosong-ikon">
            <IkonJenis />
          </div>
          <h2>Temukan {label.kosong} terdekat</h2>
          <p>Gunakan lokasi perangkat atau ketik nama daerah. Lokasi Anda hanya dipakai untuk pencarian ini dan tidak disimpan.</p>
          <ul className="fitur-mini">
            <li>Jarak dari Anda</li>
            <li>Petunjuk rute</li>
            <li>Data terbuka OpenStreetMap</li>
          </ul>
        </div>
      )}

      {titik && hasil && !memuat && (
        <>
          <div className="hasil-kepala">
            <p className="muted">
              {hasil.length ? (
                <>
                  <span className="hitung-badge">{hasil.length}</span>
                  {label.kosong.split(',')[0]} di sekitar <b>{titik.label}</b>, urut dari yang terdekat.
                </>
              ) : (
                <>
                  Tidak ada {label.kosong} yang tercatat di peta sekitar <b>{titik.label}</b>.
                </>
              )}
              {cadangan && ' Server peta utama sedang sibuk, jadi hasil mungkin belum lengkap.'}
            </p>
          </div>
          <div className="grid daftar-sekitar">
            {hasil.slice(0, jumlah).map((t, i) => (
              <article key={t.id} className="card tempat">
                <div className="tempat-atas">
                  <span className="ubin-ikon kecil">
                    <IkonJenis />
                  </span>
                  <span className="jarak">{fmtJarak(jarakKm(titik, t))}</span>
                </div>
                <h3>{t.nama}</h3>
                <div className="lencana">
                  <span className="tag">{t.jenis}</span>
                  {i === 0 && <span className="tag mulai">Terdekat</span>}
                </div>
                {t.alamat && <div className="muted">{t.alamat}</div>}
                <div className="aksi-tempat">
                  <a className="tombol" href={`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`} target="_blank" rel="noopener">
                    Rute
                  </a>
                  <a className="tombol garis" href={`https://www.openstreetmap.org/${t.id}`} target="_blank" rel="noopener">
                    Lihat di peta
                  </a>
                </div>
              </article>
            ))}
          </div>
          {hasil.length > jumlah && (
            <div className="lagi">
              <button className="tombol garis" type="button" onClick={() => setJumlah((j) => j + LANGKAH)}>
                Tampilkan lebih banyak ({hasil.length - jumlah} lagi)
              </button>
            </div>
          )}
        </>
      )}

      <p className="muted kecil sumber-peta">
        Data peta © kontributor <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>. Ada masjid atau sekolah
        yang belum tercantum atau datanya salah? Anda bisa menambahkannya di openstreetmap.org.
      </p>
    </>
  );
}

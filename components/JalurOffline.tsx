'use client';
import { useEffect, useState } from 'react';
import { IkonArtikel, IkonJadwal } from './Ikon';
import Ubin from './Ubin';
import { bacaSimpanan } from './WidgetShalat';

/** Pintasan ke halaman yang tersimpan (cadangan saat offline). */
export default function JalurOffline() {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => setSlug(bacaSimpanan()), []);
  const kota = slug ?? 'kota-jakarta';
  return (
    <div className="jelajah dua">
      <Ubin href={`/jadwal-sholat/${kota}/`} ikon={<IkonJadwal />} judul="Jadwal Shalat" ket={slug ? 'Kota terakhir yang Anda pilih.' : 'Jakarta, atau kota yang pernah Anda buka.'} />
      <Ubin href="/artikel/" ikon={<IkonArtikel />} judul="Artikel" ket="Niat, tata cara, dan doa yang sudah tersimpan." />
    </div>
  );
}

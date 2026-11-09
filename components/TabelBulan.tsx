'use client';
import { useEffect, useState } from 'react';
import { KUNCI_WAKTU, LABEL, isoTanggal, jamDinding, tanggalPendek, type JadwalHari } from '@/lib/waktu';

/** Tabel jadwal sebulan; baris hari ini disorot setelah jam perangkat terbaca. */
export default function TabelBulan({ baris, tz, nomor }: { baris: [string, JadwalHari][]; tz: number; nomor?: string }) {
  const [hariIni, setHariIni] = useState<string | null>(null);
  useEffect(() => setHariIni(isoTanggal(jamDinding(tz))), [tz]);
  return (
    <div className="scroll-x">
      <table>
        <thead>
          <tr>
            <th className={nomor ? undefined : 'cetak-saja'}>{nomor ?? 'No'}</th>
            <th>Tanggal</th>
            {KUNCI_WAKTU.map((k) => (
              <th key={k}>{LABEL[k]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map(([iso, j], i) => {
            const jumat = new Date(iso + 'T00:00:00Z').getUTCDay() === 5;
            const cls = [iso === hariIni && 'hari-ini', jumat && 'jumat'].filter(Boolean).join(' ') || undefined;
            return (
              <tr key={iso} className={cls} aria-current={iso === hariIni ? 'date' : undefined}>
                <td className={nomor ? 'kol-no' : 'cetak-saja kol-no'}>{i + 1}</td>
                <td>{tanggalPendek(iso)}</td>
                {KUNCI_WAKTU.map((k) => (
                  <td key={k}>{j[k]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

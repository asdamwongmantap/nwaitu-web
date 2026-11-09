import { situs } from '@/lib/situs';

export default function Cta() {
  return (
    <div className="cta">
      <div>
        <strong>Ibadah lebih tertata dengan aplikasi {situs.nama} (Android)</strong>
        <ul>
          <li>Pengingat adzan</li>
          <li>Tracker shalat</li>
          <li>Puasa</li>
          <li>Zakat</li>
          <li>Dzikir</li>
          <li>Tambah kajian sendiri</li>
        </ul>
      </div>
      {situs.playStore && (
        <a className="tombol emas" href={situs.playStore} rel="noopener">
          Unduh di Google Play
        </a>
      )}
    </div>
  );
}

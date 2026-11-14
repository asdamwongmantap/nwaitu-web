import { situs } from '@/lib/situs';
import { IkonUnduh } from './Ikon';

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
          <IkonUnduh />
          Unduh di Google Play
        </a>
      )}
    </div>
  );
}

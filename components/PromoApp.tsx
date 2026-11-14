import { situs } from '@/lib/situs';
import { IkonUnduh } from './Ikon';

/** Kartu kecil di banner beranda yang mengajak memasang aplikasi Android. Hilang bila tautan Play Store kosong. */
export default function PromoApp() {
  if (!situs.playStore) return null;
  return (
    <a className="promo-app" href={situs.playStore} rel="noopener">
      <img src="/img/icon-192.png" alt="" width={40} height={40} />
      <span className="pa-teks">
        <b>
          Aplikasi {situs.nama}
          <span className="pa-lebar"> untuk Android</span>
        </b>
        <span className="pa-lebar">Pengingat adzan, tracker shalat, puasa, dan dzikir</span>
        {/* Ponsel: satu baris pendek supaya banner tetap lega. */}
        <span className="pa-sempit">Android · adzan & tracker shalat</span>
      </span>
      <span className="pa-aksi">
        <IkonUnduh />
        Unduh
      </span>
    </a>
  );
}

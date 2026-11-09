// Font situs. Dipakai juga oleh pembuat poster (lib/poster.ts) lewat variabel CSS.
import { Amiri, Plus_Jakarta_Sans } from 'next/font/google';

export const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
export const amiri = Amiri({ subsets: ['arabic'], weight: '400', variable: '--font-amiri', display: 'swap' });

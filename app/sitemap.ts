import type { MetadataRoute } from 'next';
import { daftarWilayah } from '@/lib/jadwal';
import { muatKajian } from '@/lib/kajian';
import { berikutnya } from '@/lib/kajian-util';
import { artikel, situs } from '@/lib/situs';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${situs.url}${p}`;
  const now = new Date();
  const [wilayah, kajian] = await Promise.all([daftarWilayah().catch(() => []), muatKajian().catch(() => null)]);
  return [
    { url: u('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: u('/jadwal-sholat/'), changeFrequency: 'monthly', priority: 0.8 },
    { url: u('/kajian/'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: u('/artikel/'), changeFrequency: 'weekly', priority: 0.5 },
    ...wilayah.map((w) => ({ url: u(`/jadwal-sholat/${w.slug}/`), changeFrequency: 'daily' as const, priority: 0.7 })),
    ...(kajian?.kajian ?? [])
      .filter((k) => berikutnya(k, now.getTime(), kajian!.acuan))
      .map((k) => ({ url: u(`/kajian/${k.slug}/`), changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...artikel.map((a) => ({ url: u(`/artikel/${a.slug}/`), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ];
}

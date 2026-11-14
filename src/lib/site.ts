import type { Metadata } from 'next';
export function siteOrigin() {
  const value = process.env.APP_ORIGIN || 'http://localhost:3000';
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('APP_ORIGIN must be an HTTP or HTTPS origin.');
  return url.origin;
}
export const publicPaths = ['/demo'] as const;
export function pageMetadata(title: string, description: string, pathname: string, privatePage = false): Metadata {
  return { title, description, alternates: { canonical: pathname },
    openGraph: { title: title + ' | VibeDecode', description, url: pathname, type: 'website', siteName: 'VibeDecode', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'VibeDecode: make sense of what you built. Explore architecture, source explanations and coding practice.' }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
    ...(privatePage ? { robots: { index: false, follow: false } } : {}) };
}

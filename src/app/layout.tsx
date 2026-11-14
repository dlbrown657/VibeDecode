import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { siteOrigin } from '@/lib/site';
import './globals.css';
import './design.css';
import './explorer.css';
export const metadata: Metadata = { metadataBase: new URL(siteOrigin()), title: { default: 'VibeDecode — Understand what you ship', template: '%s | VibeDecode' }, description: 'Understand your code with architecture maps, source-backed explanations and hands-on practice.', openGraph: { type: 'website', siteName: 'VibeDecode', title: 'VibeDecode — Understand what you ship', description: 'Make sense of what you built with source-backed explanations and hands-on practice.' }, twitter: { card: 'summary_large_image' } };
export const dynamic = 'force-dynamic';
export default async function RootLayout({ children }: { children: React.ReactNode }) { const nonce = (await headers()).get('x-nonce') || ''; return <html lang="en"><head><meta name="csp-nonce" content={nonce} /></head><body>{children}</body></html>; }

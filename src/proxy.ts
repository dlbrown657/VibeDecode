import { httpsRedirect } from '@/lib/transport';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const secureUrl = httpsRedirect(request.url, process.env.APP_ORIGIN, process.env.NODE_ENV === 'production', process.env.TRUST_PROXY === 'true', request.headers.get('x-forwarded-proto'));
  if (secureUrl) return NextResponse.redirect(secureUrl, 308);
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const production = process.env.NODE_ENV === 'production';
  const csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'nonce-${nonce}'`, `style-src-elem 'self' 'nonce-${nonce}'`, "style-src-attr 'unsafe-inline'",
    `connect-src 'self'${production ? '' : ' ws: wss:'}`, "img-src 'self' data:", "font-src 'self'", "worker-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", ...(production ? ['upgrade-insecure-requests'] : [])].join('; ');
  const headers = new Headers(request.headers); headers.set('x-nonce', nonce); headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  const name = production ? '__Host-codeatlas-csrf' : 'codeatlas-csrf';
  if (!request.cookies.has(name)) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    response.cookies.set(name, Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''), { httpOnly: false, secure: production, sameSite: 'strict', path: '/' });
  }
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|editor-assets/|favicon.ico|icon.svg|opengraph-image|sitemap.xml|robots.txt).*)'] };

import { timingSafeEqual } from 'node:crypto';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const csrfCookie = process.env.NODE_ENV === 'production' ? '__Host-codeatlas-csrf' : 'codeatlas-csrf';
export function checkMutation(request: Request, localDemo = false) {
  const url = new URL(request.url);
  const origin = process.env.APP_ORIGIN ?? (localDemo && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? url.origin : undefined);
  if (!origin) throw new HttpError(503, 'APP_ORIGIN must be configured.');
  if (request.headers.get('origin') !== new URL(origin).origin) throw new HttpError(403, 'Request origin is not allowed.');
  const token = request.headers.get('x-csrf-token') ?? '';
  const cookie = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${csrfCookie}=`))?.slice(csrfCookie.length + 1) ?? '';
  if (!/^[a-f0-9]{64}$/.test(token) || token.length !== cookie.length || !timingSafeEqual(Buffer.from(token), Buffer.from(cookie))) throw new HttpError(403, 'Refresh this page before trying again.');
}
export async function boundedBody(request: Request, max: number) {
  if (Number(request.headers.get('content-length')) > max) throw new HttpError(413, 'Request exceeds the size limit for this input.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'An upload is required.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > max) throw new HttpError(413, 'Request exceeds the size limit for this input.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks, size);
}

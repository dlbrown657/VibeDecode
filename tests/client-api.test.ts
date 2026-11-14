import { afterEach, expect, it, vi } from 'vitest';
import { mutate } from '../src/lib/client-api';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.each(['production', 'development'])('selects the matching CSRF cookie in %s', async mode => {
  vi.stubEnv('NODE_ENV', mode);
  vi.stubGlobal('document', { cookie: '__Host-codeatlas-csrf=production-token; codeatlas-csrf=development-token' });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal('fetch', fetcher);
  await mutate('/api/practice/check');
  expect(fetcher.mock.calls[0][1].headers['X-CSRF-Token']).toBe(mode === 'production' ? 'production-token' : 'development-token');
});

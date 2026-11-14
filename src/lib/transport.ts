export function httpsRedirect(requestUrl: string, appOrigin: string | undefined, production: boolean, trustProxy: boolean, forwardedProtocol: string | null): string | null {
  const url = new URL(requestUrl);
  if (!production || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
  const canonical = appOrigin ? new URL(appOrigin) : null;
  if (!canonical || canonical.protocol !== 'https:') return null;
  const protocol = trustProxy ? forwardedProtocol?.split(',')[0].trim() || url.protocol.slice(0,-1) : url.protocol.slice(0,-1);
  if (protocol === 'https' && url.host === canonical.host) return null;
  return canonical.origin + url.pathname + url.search;
}

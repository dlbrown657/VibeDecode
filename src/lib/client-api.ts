export async function mutate(url: string, options: RequestInit = {}) {
  const name = process.env.NODE_ENV === 'production' ? '__Host-codeatlas-csrf' : 'codeatlas-csrf';
  const token = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.split('=')[1] ?? '';
  const response = await fetch(url, { ...options, method: options.method ?? 'POST', headers: { 'Content-Type': 'application/json', ...Object.fromEntries(new Headers(options.headers)), 'X-CSRF-Token': token } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'The request could not be completed.');
  return result;
}

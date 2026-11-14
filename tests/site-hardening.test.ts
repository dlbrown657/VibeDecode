import { expect, it } from 'vitest';
import { httpsRedirect } from '../src/lib/transport';
it('redirects public HTTP to the configured HTTPS origin without accepting host injection', () => {
 expect(httpsRedirect('http://evil.test/demo?q=1','https://vibedecode.example',true,false,null)).toBe('https://vibedecode.example/demo?q=1');
 expect(httpsRedirect('https://vibedecode.example/demo','https://vibedecode.example',true,false,null)).toBeNull();
 expect(httpsRedirect('http://vibedecode.example/demo','https://vibedecode.example',true,true,'https')).toBeNull();
 expect(httpsRedirect('http://vibedecode.example/demo','https://vibedecode.example',true,false,'https')).toBe('https://vibedecode.example/demo');
 expect(httpsRedirect('http://localhost:3000/demo',undefined,true,false,null)).toBeNull();
});

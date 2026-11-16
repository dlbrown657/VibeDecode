import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { localReportGenerationSchema } from '../src/lib/local-report';

if (process.argv[2] === 'schema') {
  await mkdir('output/previews', { recursive: true });
  await writeFile('output/previews/report-schema.json', JSON.stringify(z.toJSONSchema(localReportGenerationSchema, { io: 'input' }), null, 2));
  console.log('Schema written to output/previews/report-schema.json');
} else {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1'], {
    stdio: 'inherit',
    env: { ...process.env, APP_ORIGIN: 'http://127.0.0.1:3000', VIBEDECODE_LOCAL_REPORT: '1' },
  });
  child.on('error', () => { process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
}

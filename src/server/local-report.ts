import { open } from 'node:fs/promises';
import { localReportId, localReportLimit, localReportPath, localReportSchema } from '../lib/local-report';
import type { Project } from '../lib/model';

export function localReportsEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.VIBEDECODE_LOCAL_REPORT === '1';
}

export async function readLocalReport() {
  if (!localReportsEnabled()) throw new Error('Local reports are disabled.');
  const file = await open(localReportPath, 'r');
  try {
    const stats = await file.stat();
    if (!stats.isFile() || stats.size > localReportLimit) throw new Error('Invalid local report size.');
    const buffer = Buffer.alloc(localReportLimit + 1);
    const { bytesRead } = await file.read(buffer);
    if (bytesRead > localReportLimit) throw new Error('Report exceeds its size limit.');
    const { name, files, analysis } = localReportSchema.parse(JSON.parse(buffer.toString('utf8', 0, bytesRead)));
    const counts = new Map<string, number>();
    let total = 0;
    for (const file of files) {
      counts.set(file.language, (counts.get(file.language) ?? 0) + file.loc);
      total += file.loc;
    }
    const project: Project = {
      id: localReportId, name, files, total_loc: total, status: 'complete', error: null,
      created_at: stats.mtime.toISOString(),
      languages: [...counts].sort((a, b) => b[1] - a[1]).map(([name, loc]) =>
        ({ name, loc, percent: total ? Math.round(1000 * loc / total) / 10 : 0 })),
    };
    return { id: localReportId, label: 'Imported local analysis', project, analysis };
  } finally {
    await file.close();
  }
}

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { analysisSchema, type Project } from '../lib/model';
export async function readChicagoPreview() {
  if (process.env.NODE_ENV !== 'development') throw new Error('Local preview is unavailable.');
  const file = path.join(process.cwd(), 'output/previews/chicago-mobile.json');
  if ((await stat(file)).size > 2 * 1024 * 1024) throw new Error('Local preview exceeds its size limit.');
  const value = JSON.parse(await readFile(file, 'utf8'));
  if (value.id !== 'sample-chicago' || value.project?.id !== 'chicago-mobile') throw new Error('Invalid local preview.');
  return { id: 'sample-chicago', label: String(value.label), project: value.project as Project, analysis: analysisSchema.parse(value.analysis) };
}

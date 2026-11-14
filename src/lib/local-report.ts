import { z } from 'zod';
import { analysisSchema } from './model';

export const localReportLimit = 2 * 1024 * 1024;
export const localReportPath = 'output/previews/local-report.json';
export const localReportId = 'sample-local';

export const localReportSchema = z.object({
  name: z.string().trim().min(1).max(100),
  files: z.array(z.object({
    path: z.string().min(1).max(240),
    language: z.string().min(1).max(60),
    loc: z.number().int().min(0).max(1_000_000),
    lines: z.number().int().min(1).max(1_000_000),
    bytes: z.number().int().min(0).max(10_000_000),
    parser: z.string(),
    parseErrors: z.boolean(),
    symbols: z.array(z.string()),
    imports: z.array(z.string()),
    patterns: z.array(z.string()),
  })).max(2000),
  analysis: analysisSchema,
});

import { readChicagoPreview } from '@/server/chicago-preview';
import { localReportsEnabled, readLocalReport } from '@/server/local-report';
import { localReportId } from '@/lib/local-report';
import { z } from 'zod';
import { hybridSampleAnalysis as sampleAnalysis } from '@/lib/sample';
import { checkMutation, boundedBody, HttpError } from '@/server/security';
import { runPractice } from '@/server/practice-runner';
export const runtime = 'nodejs';
export const maxDuration = 30;
const input = z.object({ analysisId: z.union([z.literal('sample'), z.literal('sample-chicago'), z.literal(localReportId)]), exerciseId: z.string().min(1).max(120), kind: z.enum(['algorithm', 'debug']), code: z.string().min(1).max(20000), location: z.string().max(240).optional() });
// Limit local practice checks per process.
let active = false, windowStart = Date.now(), demoHits = 0;
export async function POST(request: Request) {
  let ownsSlot = false;
  try {
    const body = input.safeParse(JSON.parse((await boundedBody(request, 24000)).toString()));
    if (!body.success) throw new HttpError(400, 'Enter code of up to 20,000 characters.');
    const value = body.data;
    const imported = value.analysisId === localReportId;
    const localPreview = imported || value.analysisId === 'sample-chicago';
    if (imported && !localReportsEnabled()) throw new HttpError(404, 'Analysis not found.');
    if (localPreview && process.env.NODE_ENV !== 'development') throw new HttpError(404, 'Analysis not found.');
    checkMutation(request, true);
    const analysis = imported ? (await readLocalReport()).analysis : localPreview ? (await readChicagoPreview()).analysis : sampleAnalysis;
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); demoHits = 0; }
    if (++demoHits > 30) throw new HttpError(429, 'Practice check limit reached. Try again in one minute.');
    if (active) throw new HttpError(429, 'Another code check is running. Try again shortly.');
    const item = value.kind === 'debug' ? analysis.debugChallenges?.find(e => e.id === value.exerciseId) : analysis.exercises.find(e => e.id === value.exerciseId);
    if (!item?.runner) throw new HttpError(409, 'This older analysis has no runnable tests. Request a fresh analysis.');
    if (value.kind === 'debug' && value.location !== item.evidence.path) return Response.json({ verdict: 'incorrect', passed: 0, total: item.runner.cases.length, cases: [], locationCorrect: false, feedback: 'Revisit the symptom and choose the file responsible for this behavior.' });
    active = ownsSlot = true;
    const result = await runPractice(value.code, item.runner);
    return Response.json({ ...result, locationCorrect: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: 'Invalid request.' }, { status: 400 });
    if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: 'The practice check could not be completed.' }, { status: 500 });
  } finally { if (ownsSlot) active = false; }
}

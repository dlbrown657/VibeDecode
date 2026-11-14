import { expect, it } from 'vitest';
import { analysisSchema } from '../src/lib/model';
import { sampleAnalysis } from '../src/lib/sample';
it('keeps the sample aligned with the structured analysis contract', () => {
  expect(analysisSchema.safeParse(sampleAnalysis).success).toBe(true);
});

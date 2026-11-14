import { expect, it } from 'vitest';
import { analysisSchema } from '../src/lib/model';
import { sampleAnalysis } from '../src/lib/sample';
it('keeps old stored analyses readable', () => {
  const legacy = { ...sampleAnalysis, resumeBullets: undefined, debugChallenges: undefined, recallExercises: undefined, interviews: sampleAnalysis.interviews.slice(0, 4), exercises: sampleAnalysis.exercises.map(({ runner, alternatives, sourceContext, ...exercise }) => exercise) };
  expect(analysisSchema.safeParse(legacy).success).toBe(true);
});

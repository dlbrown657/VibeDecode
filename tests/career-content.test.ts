import { expect, it } from 'vitest';
import { sampleAnalysis, sampleProject } from '../src/lib/sample';
it('provides fifteen distinct questions balanced across all three categories', () => {
  expect(sampleAnalysis.interviews).toHaveLength(15);
  expect(new Set(sampleAnalysis.interviews.map(q => q.question)).size).toBe(15);
  for (const category of ['System design', 'Technical', 'Behavioral']) expect(sampleAnalysis.interviews.filter(q => q.category === category)).toHaveLength(5);
  expect(sampleAnalysis.interviews.every(q => q.answer && q.tradeoff && Object.values(q.star).every(Boolean))).toBe(true);
});
it('has technical resume bullets tied to valid project evidence without invented impact metrics', () => {
  expect(sampleAnalysis.resumeBullets!.length).toBeGreaterThanOrEqual(6);
  expect(sampleAnalysis.resumeBullets!.every(b => b.technologies.length && b.text && b.evidence)).toBe(true);
  expect(sampleAnalysis.resumeBullets!.some(b => /\d+\s*(%|users|requests per second|ms\b)/i.test(b.text))).toBe(false);
});

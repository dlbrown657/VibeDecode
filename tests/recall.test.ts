import { expect, it } from 'vitest';
import { compareRecall, gapTemplate } from '../src/lib/recall';
import { sampleRecallExercises, sampleRecallSources } from '../src/lib/sample-recall';
it('accepts line ending differences and optional indentation differences', () => {
  expect(compareRecall('function f() {\n  return 1;\n}\n', 'function f() {\r\nreturn 1;\r\n}').matched).toBe(true);
  expect(compareRecall('  return 1;', 'return 1;', false).matched).toBe(false);
});
it('preserves differences inside string literals and statements', () => {
  expect(compareRecall('return "a b";', 'return "ab";').matched).toBe(false);
  expect(compareRecall('return x >= 1;', 'return x > 1;').matched).toBe(false);
});
it('reports changed, missing and extra lines instead of claiming runtime correctness', () => {
  const result = compareRecall('const x = 1;\nreturn x;', 'const x = 1;');
  expect(result.matched).toBe(false); expect(result.matches).toBe(1);
  expect(result.lines[1]).toMatchObject({ number: 2, actual: '', expected: 'return x;', matched: false });
  expect(compareRecall('a', 'a\nb').matched).toBe(false);
});
it('creates real missing-line practice without leaking hidden lines into the draft', () => {
  const code = 'function f() {\n  const x = 1;\n  return x;\n}';
  const draft = gapTemplate(code);
  expect(draft).toContain('____'); expect(draft).not.toBe(code);
  expect(draft.split('\n')).toHaveLength(code.split('\n').length);
  expect(draft).toContain('}');
  expect(compareRecall(code, draft).matched).toBe(false);
});

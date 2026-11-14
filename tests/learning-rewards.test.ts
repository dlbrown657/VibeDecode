import { expect, it } from 'vitest';
import { addCompletion, readCompletions, validCompletion, type Completion } from '../src/lib/learning-rewards';
const item: Completion = { id: 'analysis:code:exercise', kind: 'code', completedAt: 1000 };
it('awards a completion once rather than farming repeat attempts', () => {
  const records = addCompletion([], item);
  expect(records).toHaveLength(1);
  expect(addCompletion(records, { ...item, completedAt: 2000 })).toBe(records);
  expect(addCompletion(records, { ...item, id: 'analysis:debug:other', kind: 'debug' })).toHaveLength(2);
});
it('does not discard older milestones because a learner missed a day', () => {
  const records = addCompletion([item], { ...item, id: 'much-later', completedAt: 1000 + 365 * 86400000 });
  expect(records).toHaveLength(2);
});
it('handles broken browser data without inventing progress', () => {
  expect(readCompletions('bad json')).toEqual([]);
  expect(readCompletions('{}')).toEqual([]);
  expect(readCompletions(JSON.stringify([item, item, { id: 'fake', kind: 'cash', completedAt: 1000 }]))).toEqual([item]);
  expect(validCompletion({ ...item, completedAt: Infinity })).toBe(false);
  expect(validCompletion({ ...item, id: '' })).toBe(false);
});
it('bounds local record retention', () => {
  const items = Array.from({ length: 500 }, (_, index) => ({ ...item, id: String(index) }));
  const records = addCompletion(items, item);
  expect(records).toHaveLength(500);
  expect(records[records.length - 1]).toEqual(item);
});

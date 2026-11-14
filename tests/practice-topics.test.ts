import { expect, it } from 'vitest';
import { practiceTopics, exerciseSchema } from '../src/lib/model';
import { topicsFor, filterTopic, countTopics } from '../src/lib/practice-topics';
import { sampleAnalysis } from '../src/lib/sample';
it('has real runnable coding exercises for every requested topic in the demo', () => {
  for (const topic of practiceTopics) {
    const exercises = filterTopic(sampleAnalysis.exercises, topic);
    expect(exercises.length, topic).toBeGreaterThan(0);
    expect(exercises.every(exercise => exercise.runner && exercise.connection && exercise.evidence.path)).toBe(true);
  }
});
it('filters overlapping topics without duplicating or changing exercises', () => {
  const db = filterTopic(sampleAnalysis.exercises, 'Database');
  expect(db.map(e => e.id)).toEqual(['tenant-uniqueness']);
  expect(db[0].topics).toContain('Backend');
  expect(filterTopic(sampleAnalysis.exercises, 'All')).toBe(sampleAnalysis.exercises);
  const counts = countTopics(sampleAnalysis.exercises);
  expect(counts.Testing).toBe(1); expect(counts.Design).toBe(2);
});
it('keeps empty topic states honest across practice modes', () => {
  expect(filterTopic(sampleAnalysis.debugChallenges!, 'Frontend')).toEqual([]);
  expect(filterTopic(sampleAnalysis.debugChallenges!, 'Debugging')).toHaveLength(4);
});
it.each([['src/components/Feed.tsx','Frontend'],['db/schema.sql','Database'],['tests/events.test.ts','Testing'],['src/api/ingest.ts','Backend']] as const)('classifies legacy path %s conservatively', (path, expected) => {
  expect(topicsFor({ evidence: { path } })).toEqual([expected]);
});
it('does not assign a guessed topic to unrelated legacy files', () => {
  expect(topicsFor({ evidence: { path: 'README.md' } })).toEqual([]);
});
it('rejects unknown topic labels in stored exercise data', () => {
  expect(exerciseSchema.safeParse({ ...sampleAnalysis.exercises[0], topics: ['Made-up'] }).success).toBe(false);
});

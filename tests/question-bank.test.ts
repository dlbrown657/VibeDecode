import { expect, it } from 'vitest';
import { interviewBank, rankQuestions } from '../src/lib/question-bank';
import { codingBank } from '../src/lib/coding-bank';
import { runPractice } from '../src/server/practice-runner';
it('provides 100 unique original questions with ten interviews per language group', () => {
  const all = [...interviewBank, ...codingBank];
  expect(all).toHaveLength(100);
  expect(new Set(all.map(q => q.id)).size).toBe(100);
  for (const language of ['JavaScript/TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go']) expect(interviewBank.filter(q => q.language === language)).toHaveLength(10);
  expect(interviewBank.filter(q => !q.language)).toHaveLength(20);
  expect(codingBank.filter(q => q.difficulty === 'Easy')).toHaveLength(10);
  expect(codingBank.filter(q => q.difficulty === 'Medium')).toHaveLength(8);
  expect(codingBank.filter(q => q.difficulty === 'Hard')).toHaveLength(2);
});

it('never recommends a different language and returns no matches without evidence', () => {
  for (const language of ['Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'JavaScript', 'TypeScript']) {
    const matches = rankQuestions(interviewBank, [{ path: 'source', line: 1, language, text: 'async queue lookup test' }], 100);
    expect(matches.every(c => !c.item.language || (['JavaScript', 'TypeScript'].includes(language) ? c.item.language === 'JavaScript/TypeScript' : c.item.language === language))).toBe(true);
  }
  expect(rankQuestions(interviewBank, [], 24)).toEqual([]);
  expect(rankQuestions(codingBank, [{ path: 'x', line: 1, language: 'Python', text: 'unrelated prose' }], 10)).toEqual([]);
});

it('executes all 20 reference implementations against their behavioral tests', async () => {
  for (const item of codingBank) {
    const result = await runPractice(item.implementation.solution, item.runner);
    expect(result.verdict, `${item.id}: ${JSON.stringify(result)}`).toBe('correct');
    expect((await runPractice(item.implementation.starter, item.runner)).verdict, item.id).not.toBe('correct');
  }
}, 120000);

import { describe, expect, it } from 'vitest';
import { runPractice } from '../src/server/practice-runner';
import { sampleAnalysis } from '../src/lib/sample';
import type { Runner } from '../src/lib/model';
const one: Runner = { entry: 'solve', preserveInput: true, cases: [{ name: 'Basic', args: '[[1,2]]', expected: '3', matcher: 'exact' }] };
describe('sandboxed practice checking', () => {
  it.each(sampleAnalysis.exercises)('accepts the reference and alternative for $title', async exercise => {
    expect((await runPractice(exercise.languages.TypeScript.solution, exercise.runner!)).verdict).toBe('correct');
    for (const alternative of exercise.alternatives ?? []) expect((await runPractice(alternative.code, exercise.runner!)).verdict).toBe('correct');
  });
  it.each(sampleAnalysis.debugChallenges!)('detects the bug and accepts both repairs for $title', async challenge => {
    expect((await runPractice(challenge.buggyCode, challenge.runner)).verdict).toBe('incorrect');
    expect((await runPractice(challenge.solution, challenge.runner)).verdict).toBe('correct');
    for (const alternative of challenge.alternatives) expect((await runPractice(alternative.code, challenge.runner)).verdict).toBe('correct');
  });
  it('accepts a different implementation rather than matching solution text', async () => {
    expect((await runPractice('const solve = (values: number[]) => values.reduce((a,b) => a+b, 0)', one)).verdict).toBe('correct');
  });
  it('rejects incorrect values and changed inputs', async () => {
    expect((await runPractice('function solve(a) { return 9; }', one)).verdict).toBe('incorrect');
    const result = await runPractice('function solve(a) { a.push(3); return 3; }', one);
    expect(result.verdict).toBe('incorrect'); expect(result.cases[0].error).toContain('changed');
  });
  it('terminates an infinite loop', async () => {
    const result = await runPractice('function solve() { while(true) {} }', one, 50);
    expect(result.verdict).toBe('incorrect'); expect(result.cases[0].error).toContain('Time limit');
  });
  it('does not expose host APIs or load modules', async () => {
    const spec: Runner = { ...one, cases: [{ name: 'No host', args: '[]', expected: 'true', matcher: 'exact' }] };
    const code = 'function solve() { return typeof process === "undefined" && typeof require === "undefined" && typeof fetch === "undefined" && typeof console === "undefined"; }';
    expect((await runPractice(code, spec)).verdict).toBe('correct');
    expect((await runPractice('function solve() { return require("fs").readFileSync(".env.local"); }', one)).verdict).toBe('incorrect');
  });
  it('reports compile and runtime errors without crashing', async () => {
    expect((await runPractice('function solve( {', one)).cases[0].name).toBe('Compilation');
    expect((await runPractice('function solve() { throw new Error("Try again"); }', one)).cases[0].error).toBe('Try again');
  });
  it('bounds runaway allocation', async () => {
    const result = await runPractice('function solve() { const a=[]; while(true) a.push(new Array(100000).fill(1)); }', one, 500);
    expect(result.verdict).toBe('incorrect');
  });
  it('accepts any valid topological order', async () => {
    const spec: Runner = { entry: 'solve', preserveInput: true, cases: [{ name: 'Independent tasks', args: '[3,[]]', expected: '[0,1,2]', matcher: 'topological' }] };
    expect((await runPractice('function solve() { return [2,1,0]; }', spec)).verdict).toBe('correct');
    expect((await runPractice('function solve() { return [2,2,0]; }', spec)).verdict).toBe('incorrect');
  });
});

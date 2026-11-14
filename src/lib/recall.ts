export type RecallMode = 'memory' | 'along' | 'gaps';
export type RecallComparison = { matched: boolean; matches: number; total: number; lines: { number: number; expected: string; actual: string; matched: boolean }[] };
function lines(value: string) { return value.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n'); }
export function compareRecall(original: string, attempt: string, ignoreIndentation = true): RecallComparison {
  const expected = lines(original), actual = lines(attempt);
  const normalize = (value: string) => ignoreIndentation ? value.trim() : value.trimEnd();
  const rows = Array.from({ length: Math.max(expected.length, actual.length) }, (_, index) => ({
    number: index + 1, expected: expected[index] ?? '', actual: actual[index] ?? '',
    matched: index < expected.length && index < actual.length && normalize(expected[index]) === normalize(actual[index]),
  }));
  return { matched: rows.every(row => row.matched), matches: rows.filter(row => row.matched).length, total: rows.length, lines: rows };
}
export function gapTemplate(code: string) {
  let eligible = 0;
  const rows = lines(code);
  const candidates = rows.map((line, i) => line.trim().length > 1 && !/^[{}()[\];,]+$/.test(line.trim()) ? i : -1).filter(i => i >= 0);
  const hidden = new Set(candidates.filter(() => eligible++ % 2 === 0));
  if (!hidden.size && rows.length) hidden.add(0);
  return rows.map((line, index) => hidden.has(index) ? `${line.match(/^\s*/)?.[0] ?? ''}____` : line).join('\n');
}

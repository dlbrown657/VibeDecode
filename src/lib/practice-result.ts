export type CheckResult = {
  verdict: 'correct' | 'incorrect';
  passed: number; total: number;
  cases: { name: string; passed: boolean; expected: string; actual: string; error?: string }[];
};

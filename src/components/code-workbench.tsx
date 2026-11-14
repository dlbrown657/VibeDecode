'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, Play, RotateCcw, LoaderCircle, Lightbulb } from 'lucide-react';
import { mutate } from '@/lib/client-api';
import { emitLearningCompletion } from '@/lib/learning-rewards';
import type { Runner } from '@/lib/model';
import type { CheckResult } from '@/lib/practice-result';
import { CodeEditor } from './code-editor';
import { Button } from './ui/button';
type Result = CheckResult & { locationCorrect?: boolean; feedback?: string; checkedLocation?: string };
export function CodeWorkbench({ analysisId, exerciseId, kind = 'algorithm', starter, solution, explanation, alternatives = [], runner, location }: {
  analysisId: string; exerciseId: string; kind?: 'algorithm' | 'debug'; starter: string; solution: string; explanation: string;
  alternatives?: { title: string; explanation: string; code: string }[]; runner?: Runner; location?: string;
}) {
  const id = useId();
  const [code, setCode] = useState(starter), [attempt, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [revealed, setRevealed] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const result = attempt?.checkedLocation === location ? attempt : null;
  useEffect(() => { if (result) feedback.current?.focus(); }, [result]);
  async function check(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try {
      const answer = await mutate('/api/practice/check', { body: JSON.stringify({ analysisId, exerciseId, kind, code, location }) });
      setResult({ ...answer, checkedLocation: location }); if (answer.verdict === 'correct') emitLearningCompletion(`${analysisId}:${kind}:${exerciseId}`, kind === 'debug' ? 'debug' : 'code'); if (answer.verdict === 'incorrect') setRevealed(true);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <section className="code-workbench" aria-labelledby={`${id}-title`}>
    <div className="workbench-heading"><div><span className="eyebrow">Write · run · understand</span><h4 id={`${id}-title`}>Try your answer in TypeScript</h4></div><span className="badge neutral">{runner?.cases.length ?? 0} behavioral tests</span></div>
    <p id={`${id}-help`}>Use <code>{runner?.entry ?? 'the starter function'}</code> with the same arguments. Different implementations are welcome. Tests check behavior, not a match to the solution. Synchronous functions only; no packages or I/O.</p>
    {runner && <details className="regression-tests"><summary>Inspect the test inputs & expected behavior</summary><ul className="check-cases">{runner.cases.map((test, i) => <li key={i}><strong>{test.name}</strong><p>Arguments: <code>{test.args}</code></p><p>Expected: <code>{test.expected}</code>{test.matcher === 'topological' ? ' or any other valid dependency order (empty only for a cycle or no tasks).' : ''}</p></li>)}</ul></details>}
    {!runner ? <p className="config-notice">This saved analysis predates runnable practice. Request a new analysis to generate tests.</p> : <form onSubmit={check}>
      <label className="editor-label" htmlFor={`${id}-code`}>Your TypeScript code</label>
      <CodeEditor id={`${id}-code`} value={code} onChange={value => { setCode(value); setResult(null); setError(''); }} describedBy={`${id}-help`} disabled={busy} />
      <div className="editor-actions"><Button type="submit" disabled={busy || !code.trim() || (kind === 'debug' && !location)}>{busy ? <LoaderCircle size={15} className="spin" /> : <Play size={15} />}{busy ? 'Checking…' : 'Check answer'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { setCode(starter); setResult(null); setRevealed(false); setError(''); }}><RotateCcw size={14} />Reset code</Button><small>{code.length.toLocaleString()} / 20,000 characters</small></div>
    </form>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div ref={feedback} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">{result && <div className={`check-verdict ${result.verdict}`}><strong>{result.verdict === 'correct' ? 'Correct — all tests passed.' : 'Incorrect — let’s work through it.'}</strong><p>{result.feedback ?? `${result.passed} of ${result.total} tests passed.`}{result.verdict === 'correct' ? ' Passing this suite does not prove correctness for every possible input or the required complexity.' : ' Review the failing cases and the worked solutions below, then revise your code.'}</p></div>}</div>
    {result && result.cases.length > 0 && <ul className="check-cases" aria-label="Test results">{result.cases.map((test, i) => <li key={i}><strong>{test.passed ? '✓ Passed' : '✕ Failed'} · {test.name}</strong>{!test.passed && <><p>Expected: <code>{test.expected}</code></p>{test.error ? <p>{test.error}</p> : <p>Received: <code>{test.actual}</code></p>}</>}</li>)}</ul>}
    <details className="solution worked-solution" open={revealed} onToggle={event => setRevealed(event.currentTarget.open)}><summary><Lightbulb size={17} />{revealed ? 'Worked solution & other approaches' : 'Show a worked solution & other approaches'}</summary><p>{explanation}</p><pre className="code-block" tabIndex={0} aria-label="Correct TypeScript example"><code>{solution}</code></pre><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => { setCode(solution); setResult(null); }}>Try this solution in the editor</Button>{alternatives.map((alternative, i) => <div className="alternative-solution" key={i}><h4><Check size={15} />{alternative.title}</h4><p>{alternative.explanation}</p><pre className="code-block" tabIndex={0} aria-label={alternative.title}><code>{alternative.code}</code></pre><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => { setCode(alternative.code); setResult(null); }}>Try this approach</Button></div>)}</details>
  </section>;
}

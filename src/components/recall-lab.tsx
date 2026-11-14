'use client';
import { useId, useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, PenLine, RotateCcw } from 'lucide-react';
import type { RecallExercise } from '@/lib/model';
import { compareRecall, gapTemplate, type RecallComparison, type RecallMode } from '@/lib/recall';
import { Button } from './ui/button';
import { emitLearningCompletion } from '@/lib/learning-rewards';

const modes: { value: RecallMode; title: string; description: string }[] = [
  { value: 'memory', title: 'From memory', description: 'Study the original, hide it, and rewrite the whole snippet.' },
  { value: 'along', title: 'Type along', description: 'Keep the original visible while you build familiarity by typing it.' },
  { value: 'gaps', title: 'Fill missing lines', description: 'Rebuild the missing lines using the surrounding code as a guide.' },
];
function RecallTask({ exercise, analysisId }: { exercise: RecallExercise; analysisId: string }) {
  const id = useId(), editor = useRef<HTMLTextAreaElement>(null), feedback = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<RecallMode>('memory'), [started, setStarted] = useState(false), [reference, setReference] = useState(true);
  const [draft, setDraft] = useState(''), [result, setResult] = useState<RecallComparison | null>(null), [ignoreIndentation, setIgnoreIndentation] = useState(true);
  function start(nextMode = mode) {
    setMode(nextMode); setStarted(true); setDraft(nextMode === 'gaps' ? gapTemplate(exercise.code) : '');
    setReference(nextMode === 'along'); setResult(null);
    requestAnimationFrame(() => editor.current?.focus());
  }
  function compare(event: React.FormEvent) {
    event.preventDefault(); const comparison = compareRecall(exercise.code, draft, ignoreIndentation); setResult(comparison);
    if (comparison.matched) emitLearningCompletion(`${analysisId}:recall:${exercise.id}`, 'recall');
    requestAnimationFrame(() => feedback.current?.focus());
  }
  return <article className="card practice-detail recall-detail"><div className="card-header"><div><span className="badge neutral">{exercise.kind}</span><span className="pattern-label">{exercise.language}</span><h3>{exercise.title}</h3></div><PenLine size={22} /></div>
    <p className="recall-source"><BookOpen size={14} /><code>{exercise.evidence.path}:{exercise.evidence.line}–{exercise.endLine}</code></p>
    <div className="recall-explanations"><section><h4>What this code does</h4><p>{exercise.whatItDoes}</p></section><section><h4>Why it’s needed</h4><p>{exercise.whyNeeded}</p></section></div>
    <details className="recall-steps"><summary>Understand the steps before memorizing</summary><ol>{exercise.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></details>
    <fieldset className="recall-modes"><legend>Choose how to practice</legend>{modes.map(option => <label key={option.value}><input type="radio" name={`${id}-mode`} value={option.value} checked={mode === option.value} onChange={() => { setMode(option.value); setStarted(false); setReference(true); setDraft(''); setResult(null); }} /><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</fieldset><p className="small-muted">Changing practice mode starts a new attempt.</p>
    <div className="recall-reference-heading"><h4>Original file excerpt</h4>{started && mode !== 'along' && <Button variant="ghost" size="sm" aria-expanded={reference} aria-controls={`${id}-reference`} onClick={() => setReference(!reference)}>{reference ? <EyeOff size={15} /> : <Eye size={15} />}{reference ? 'Hide reference' : 'Show reference'}</Button>}</div>
    <div id={`${id}-reference`} hidden={!reference}>{reference && <pre className="code-block" tabIndex={0} aria-label="Original source excerpt"><code>{exercise.code}</code></pre>}</div>
    {!reference && <p className="recall-hidden">Reference hidden. Use the explanation and steps to recall the code.</p>}
    {!started ? <Button onClick={() => start()}><PenLine size={16} />{mode === 'memory' ? 'Hide code & write from memory' : mode === 'gaps' ? 'Hide code & fill the gaps' : 'Start typing with the reference'}</Button> : <form onSubmit={compare}>
      <label className="editor-label" htmlFor={`${id}-draft`}>{mode === 'gaps' ? 'Replace each ____ with the missing source line' : 'Rewrite the original code'}</label>
      <p id={`${id}-help`} className="small-muted">Recall the file’s wording and line order. This exercise compares text; it does not execute code or judge equivalent implementations.</p>
      <textarea ref={editor} id={`${id}-draft`} className="practice-editor" rows={Math.max(8, Math.min(22, exercise.code.split('\n').length + 1))} value={draft} onChange={event => { setDraft(event.target.value); setResult(null); }} maxLength={12000} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={`${id}-help`} />
      <label className="recall-indentation"><input type="checkbox" checked={ignoreIndentation} onChange={event => { setIgnoreIndentation(event.target.checked); setResult(null); }} />Ignore indentation when comparing <span>(useful for recall; indentation still matters in Python)</span></label>
      <div className="editor-actions"><Button type="submit" disabled={!draft.trim()}>Compare with original</Button><Button type="button" variant="ghost" onClick={() => start()}><RotateCcw size={14} />Start again</Button></div>
    </form>}
    <div ref={feedback} role="status" tabIndex={-1} aria-live="polite">{result && <div className={`check-verdict ${result.matched ? 'correct' : 'incorrect'}`}><strong>{result.matched ? 'Matched the original — nicely recalled.' : `${result.matches} of ${result.total} lines match the original.`}</strong><p>{result.matched ? 'Try hiding the reference and doing it again, then explain why each step is needed.' : 'Review the changed or missing lines below, then revise your attempt. Different code can still work; this check measures recall of this exact excerpt.'}</p></div>}</div>
    {result && !result.matched && <section className="recall-differences" aria-label="Lines to revisit"><h4>Compare your lines with the file</h4><ul className="check-cases">{result.lines.filter(line => !line.matched).map(line => <li key={line.number}><strong>Excerpt line {line.number} · file line {exercise.evidence.line + line.number - 1}</strong><p>Original</p><pre><code>{line.expected || '(no line)'}</code></pre><p>Your attempt</p><pre><code>{line.actual || '(missing line)'}</code></pre></li>)}</ul></section>}
  </article>;
}
export function RecallLab({ exercises, analysisId = 'sample' }: { exercises: RecallExercise[]; analysisId?: string }) {
  const [selected, setSelected] = useState(exercises[0]?.id);
  const exercise = exercises.find(item => item.id === selected) ?? exercises[0];
  if (!exercise) return <div className="card processing"><BookOpen size={28} /><h3>Learn the code already in your files</h3><p>Request a fresh analysis from Analysis history to select real source excerpts and generate explanations for memory practice.</p></div>;
  return <div className="practice-layout"><nav className="exercise-nav" aria-label="Source code to memorize">{exercises.map(item => <button key={item.id} className={`exercise-choice ${item.id === exercise.id ? 'active' : ''}`} aria-pressed={item.id === exercise.id} onClick={() => setSelected(item.id)}><BookOpen size={16} /><span><span>{item.kind}</span><strong>{item.title}</strong><small>{item.language} · {item.evidence.path}</small></span></button>)}<p className="practice-note">Learn the project’s core flow and the supporting helpers you should be able to explain and rewrite.</p></nav><RecallTask key={exercise.id} analysisId={analysisId} exercise={exercise} /></div>;
}

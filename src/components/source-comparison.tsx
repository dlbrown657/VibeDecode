'use client';
import { useId, useState } from 'react';
import { ArrowRight, FileCode2 } from 'lucide-react';
import type { SourceContext } from '@/lib/model';

function NumberedCode({ code, start, highlighted, label }: { code: string; start: number; highlighted: Set<number>; label: string }) {
  return <pre className="source-code" tabIndex={0} aria-label={label}><code>{code.split('\n').map((line, index) => <span key={index} className={highlighted.has(start + index) ? 'source-line mapped' : 'source-line'}><span className="source-line-number" aria-hidden="true">{start + index}</span><span>{line || ' '}</span></span>)}</code></pre>;
}
export function SourceComparison({ context, practiceCode, debug = false }: { context?: SourceContext; practiceCode: string; debug?: boolean }) {
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  if (!context) return <aside className="source-comparison source-unavailable"><h4>From your code to this question</h4><p>This older analysis has a file reference but no stored source comparison. Request a fresh analysis to see the original excerpt and its connection to the question.</p></aside>;
  const mappings = selected === null ? context.similarities : [context.similarities[selected]];
  const sourceHighlights = new Set(mappings.map(item => item.sourceLine));
  const practiceHighlights = new Set(mappings.map(item => item.practiceLine));
  return <section className="source-comparison" aria-labelledby={`${id}-title`}><div className="source-heading"><span className="eyebrow"><FileCode2 size={14} />The code behind this question</span><h4 id={`${id}-title`}>From your code to this question</h4><p>{context.whySelected}</p></div>
    <div className="source-origin"><strong>Original project code · {context.language}</strong><code>{context.evidence.path}:{context.evidence.line}–{context.endLine}</code></div>
    <NumberedCode code={context.code} start={context.evidence.line} highlighted={sourceHighlights} label="Original project code with matching lines highlighted" />
    <details className="source-mapping-details"><summary>{debug ? 'Show how the project code relates to this debugging exercise (may reveal the fix)' : 'Show similarities with the worked solution (contains solution code)'}</summary><p className="source-legend">Highlighted lines share a pattern or responsibility. The mapping explains the connection; it is not a text-similarity score.</p>
      <div className="similarity-mappings" role="group" aria-label="Select a similarity to highlight"><button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)}>Highlight all connections</button>{context.similarities.map((item, index) => <button key={index} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}><span>File line {item.sourceLine}<ArrowRight size={12} />Practice line {item.practiceLine}</span><strong>{item.explanation}</strong></button>)}</div>
      <div className="similarity-code-grid"><div><h5>In your project</h5><NumberedCode code={context.code} start={context.evidence.line} highlighted={sourceHighlights} label="Source excerpt in side-by-side comparison" /></div><div><h5>In the practice solution · TypeScript</h5><NumberedCode code={practiceCode} start={1} highlighted={practiceHighlights} label="Practice solution with corresponding lines highlighted" /></div></div>
      <div className="source-differences"><strong>What changed for practice</strong><p>{context.differences}</p></div>
    </details>
  </section>;
}

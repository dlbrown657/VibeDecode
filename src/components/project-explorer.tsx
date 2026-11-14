'use client';
import { useId, useState } from 'react';
import type { Analysis } from '@/lib/model';
import { selectedSource, type Exploration, type SourceExcerpt, type SourceRange } from '@/lib/exploration';

type Step = Exploration['data_flow_steps'][number]['steps'][number];
const refKey = (r: SourceRange) => `${r.path}:${r.line}:${r.endLine}`;

function SourceInspector({ excerpts, source, steps }: { excerpts: SourceExcerpt[]; source: SourceRange; steps: Step[] }) {
  const id = useId();
  const excerpt = excerpts.find(e => e.path === source.path && e.line <= source.line && e.endLine >= source.endLine);
  const [range, setRange] = useState(source);
  const [explained, setExplained] = useState(false);
  if (!excerpt) return <p className="explorer-empty">This reference has no saved source excerpt. Run a fresh analysis to inspect it.</p>;
  const blocks = steps.filter(s => s.source.path === range.path && s.source.line <= range.endLine && s.source.endLine >= range.line).slice(0, 4);
  let code = '', error = '';
  try { code = selectedSource(excerpts, range).code; } catch (e) { error = (e as Error).message; }
  function choose(line: number, endLine: number) { setRange({ path: source.path, line, endLine }); setExplained(false); }
  return <section className="explorer-source" aria-labelledby={`${id}-title`}>
    <div className="explorer-source-heading"><h3 id={`${id}-title`}>Read the source</h3><span>{excerpt.language}</span></div>
    <p className="explorer-file">{excerpt.path}:{excerpt.line}–{excerpt.endLine}</p>
    <p>Highlight code to choose lines, or use the line controls. Only this reviewed excerpt is saved.</p>
    <label htmlFor={`${id}-code`}>Saved code, starting at line {excerpt.line}</label>
    <textarea id={`${id}-code`} className="explorer-code" readOnly spellCheck={false} value={excerpt.code} rows={Math.min(16, excerpt.code.split('\n').length + 1)} onSelect={event => {
      const el = event.currentTarget;
      if (el.selectionStart === el.selectionEnd) return;
      choose(excerpt.line + el.value.slice(0, el.selectionStart).split('\n').length - 1,
        excerpt.line + el.value.slice(0, Math.max(el.selectionStart, el.selectionEnd - 1)).split('\n').length - 1);
    }} />
    <div className="explorer-line-controls"><label>From line<select aria-label="First selected line" value={range.line} onChange={e => choose(Number(e.target.value), Math.max(Number(e.target.value), range.endLine))}>{Array.from({ length: excerpt.endLine - excerpt.line + 1 }, (_, i) => <option key={i}>{excerpt.line + i}</option>)}</select></label>
      <label>Through line<select aria-label="Last selected line" value={range.endLine} onChange={e => choose(Math.min(range.line, Number(e.target.value)), Number(e.target.value))}>{Array.from({ length: excerpt.endLine - excerpt.line + 1 }, (_, i) => <option key={i}>{excerpt.line + i}</option>)}</select></label>
      <button type="button" disabled={Boolean(error)} onClick={() => setExplained(true)}>Explain this block</button>
    </div>
    <p className="explorer-scope">Uses saved surrounding-block explanations. No additional AI request is made.</p>
    {error && <p role="alert">{error}</p>}
    {explained && <div className="explorer-explanation" role="status"><h4>Selected lines {range.line}–{range.endLine}</h4><pre><code>{code}</code></pre>
      <p><strong>In the surrounding block: </strong>{blocks.length ? blocks.map(b => `${b.what} ${b.how}`).join(' ') : 'This selection belongs to the saved file above. No block-level explanation was stored for these lines; follow a mapped feature or flow step to find an explained block.'}</p>
      <p><strong>If the surrounding block fails: </strong>{blocks.length ? blocks.map(b => b.ifBroken).join(' ') : 'The effect is not verified from this excerpt. Inspect the caller and test the behavior before removing or changing the selected lines.'}</p>
      <p className="explorer-scope">These paragraphs describe the saved block, not a new analysis of the exact selection. Effects of deleting individual lines may differ.</p>
    </div>}
  </section>;
}

function Topology({ topology, selected, onSelect }: { topology: Exploration['topology']; selected: string; onSelect: (id: string) => void }) {
  const titleId = useId();
  const arrowId = useId().replace(/:/g, '');
  const width = 940, height = Math.max(170, Math.ceil(topology.nodes.length / 3) * 155);
  const position = (index: number) => ({ x: 30 + index % 3 * 310, y: 35 + Math.floor(index / 3) * 155 });
  return <div className="explorer-diagram"><svg viewBox={`0 0 ${width} ${height}`} role="group" aria-labelledby={titleId}><title id={titleId}>Project architecture. Select a node to inspect its source. Solid connections are source-backed; dashed connections are inferred.</title>
    <defs><marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#53647d" /></marker></defs>
    {topology.edges.map((edge, i) => {
      const a = position(topology.nodes.findIndex(n => n.id === edge.from)), b = position(topology.nodes.findIndex(n => n.id === edge.to));
      const sameRow = a.y === b.y;
      const x1 = a.x + (sameRow ? (b.x > a.x ? 250 : 0) : 125), y1 = a.y + (sameRow ? 38 : 76);
      const x2 = b.x + (sameRow ? (b.x > a.x ? 0 : 250) : 125), y2 = b.y + (sameRow ? 38 : 0);
      const skipsNode = sameRow && Math.abs(a.x - b.x) > 310;
      const path = skipsNode ? `M${a.x + 125},${a.y} C${a.x + 125},${a.y - 30} ${b.x + 125},${b.y - 30} ${b.x + 125},${b.y}` : `M${x1},${y1} C${x1},${y1 + (sameRow ? 0 : 35)} ${x2},${y2 - (sameRow ? 0 : 35)} ${x2},${y2}`;
      return <path key={i} d={path} fill="none" stroke="#53647d" strokeWidth="2" strokeDasharray={edge.confidence === 'Inferred' ? '7 5' : undefined} markerEnd={`url(#${arrowId})`}><title>{edge.label}: {edge.confidence}. {edge.reason}</title></path>;
    })}
    {topology.nodes.map((node, i) => { const p = position(i); return <g key={node.id} role="button" tabIndex={0} aria-label={`Inspect ${node.label}`} aria-pressed={selected === node.id} onClick={() => onSelect(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node.id); } }} className={selected === node.id ? 'explorer-node selected' : 'explorer-node'}>
      <rect x={p.x} y={p.y} width="250" height="76" rx="10" /><text x={p.x + 15} y={p.y + 27}>{node.layer.length > 28 ? node.layer.slice(0, 27) + '…' : node.layer}</text><text className="explorer-node-label" x={p.x + 15} y={p.y + 53}>{node.label.length > 27 ? node.label.slice(0, 26) + '…' : node.label}</text>
    </g>; })}
  </svg><p>Solid line: source-backed connection. Dashed line: inferred connection. An isolated node has no supported connection in this review.</p></div>;
}

export function ProjectExplorer({ analysis, onPractice }: { analysis: Analysis; onPractice: (id: string) => void }) {
  const data = analysis.exploration;
  const [view, setView] = useState('features');
  const [featureId, setFeatureId] = useState(data?.screen_mapping[0]?.id ?? '');
  const [stepId, setStepId] = useState('');
  const [nodeId, setNodeId] = useState(data?.topology.nodes[0]?.id ?? '');
  const [inspection, setInspection] = useState<SourceRange | null>(null);
  const [mechanicFilter, setMechanicFilter] = useState('All');
  const [filePath, setFilePath] = useState(analysis.sourceExcerpts?.[0]?.path ?? '');
  if (!data) return <section className="card explorer-empty"><h2>Explore your project by feature</h2><p>This saved analysis predates the feature explorer. Run a fresh analysis to create feature maps, source-linked flows and a hidden-mechanics review. Existing explanations and practice remain available in the other tabs.</p></section>;
  const excerpts = analysis.sourceExcerpts ?? [];
  const feature = data.screen_mapping.find(f => f.id === featureId) ?? data.screen_mapping[0];
  const steps = data.data_flow_steps.find(f => f.featureId === feature?.id)?.steps ?? [];
  const allSteps = data.data_flow_steps.flatMap(f => f.steps);
  const step = steps.find(s => s.id === stepId) ?? steps[0];
  const node = data.topology.nodes.find(n => n.id === nodeId);
  const files = [...new Set(excerpts.map(e => e.path))];
  const source = inspection ?? (view === 'features' ? step?.source ?? feature?.sources[0] : view === 'architecture' ? node?.source : undefined);
  const changeView = (next: string) => { setView(next); setInspection(null); };
  return <section className="project-explorer"><header className="explorer-intro"><h2>Start with what your project does.</h2><p>Choose a feature, follow the code, and see what works behind the screen. These connections come from a bounded source review, not a recording of the running app.</p></header>
    <div className="explorer-tabs" role="group" aria-label="Explorer view">{[['features', 'Feature map'], ['architecture', 'Architecture'], ['mechanics', 'Behind the scenes'], ['patterns', 'Patterns & terms'], ['files', 'Reviewed files']].map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => changeView(key)}>{label}</button>)}</div>
    {view === 'features' && <div className="explorer-feature-layout"><nav className="explorer-feature-list" aria-label="Project features">{data.screen_mapping.map(f => <button type="button" key={f.id} aria-pressed={feature?.id === f.id} onClick={() => { setFeatureId(f.id); setStepId(''); setInspection(null); }}><strong>{f.feature}</strong><span>{f.confidence}</span></button>)}{!feature && <p>No feature mapping was supported by the reviewed source.</p>}</nav>
      <div className="explorer-journey">{feature && <><h3>{feature.feature}</h3><p>{feature.visibleResult}</p><p className="explorer-scope">{feature.confidence}. A file-to-feature relationship does not establish the exact visual layout.</p>
        <div className="explorer-feature-files" aria-label="Files supporting this feature">{feature.sources.map((r, i) => <button key={i} type="button" onClick={() => setInspection(r)}>{r.path}:{r.line}</button>)}</div>
        <ol className="explorer-flow" aria-label="Code journey">{steps.map(s => <li key={s.id}><button type="button" aria-pressed={step?.id === s.id && !inspection} onClick={() => { setStepId(s.id); setInspection(null); }}><span>{s.layer}</span><strong>{s.title}</strong><small>{s.connection}</small></button></li>)}</ol>
        {!steps.length && <p>No end-to-end journey was established in these excerpts. Select a supporting file to read the available code.</p>}
        {step && <article className="explorer-step"><h4>{step.title}</h4><p className={`explorer-confidence ${step.connection === 'Inferred' ? 'inferred' : ''}`}>{step.connection}: {step.connectionReason}</p><dl>{[['What it does', step.what], ['How it works', step.how], ['Likely reason for this approach', step.likelyReason], ['The trade-off', step.tradeoff], ['What could fail', step.ifBroken]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>}
      </>}</div></div>}
    {view === 'architecture' && <div className="explorer-architecture"><h3>How the parts connect</h3>{data.topology.nodes.length ? <><Topology topology={data.topology} selected={nodeId} onSelect={id => { setNodeId(id); setInspection(null); }} /><label className="explorer-node-select">Inspect a component<select value={nodeId} onChange={e => { setNodeId(e.target.value); setInspection(null); }}>{data.topology.nodes.map(n => <option value={n.id} key={n.id}>{n.label} ({n.layer})</option>)}</select></label>
      {node && <section className="explorer-connections"><h4>{node.label}</h4><p>{node.source.path}:{node.source.line}–{node.source.endLine}</p>{data.topology.edges.filter(e => e.from === node.id || e.to === node.id).map((e, i) => <button type="button" key={i} onClick={() => setInspection(e.source)}><strong>{data.topology.nodes.find(n => n.id === e.from)?.label} → {data.topology.nodes.find(n => n.id === e.to)?.label}</strong><span>{e.label} ({e.confidence})</span><p>{e.reason}</p></button>)}{!data.topology.edges.some(e => e.from === node.id || e.to === node.id) && <p>No supported connection to this node was established in the reviewed excerpts.</p>}</section>}</> : <p>No architecture graph was supported by this source.</p>}</div>}
    {view === 'mechanics' && <section className="explorer-mechanics"><h3>What happens behind the scenes</h3><p>“Found” means handling appears in the excerpt. A potential concern needs investigation. “Not verified” means the supplied code cannot settle the question.</p><label>Filter findings<select value={mechanicFilter} onChange={e => { setMechanicFilter(e.target.value); setInspection(null); }}>{['All', 'Found', 'Potential concern', 'Not verified'].map(s => <option key={s}>{s}</option>)}</select></label>
      {data.hidden_mechanics.filter(m => mechanicFilter === 'All' || m.status === mechanicFilter).map(m => <article className="explorer-mechanic" key={m.id}><div><span className={`explorer-confidence ${m.status !== 'Found' ? 'inferred' : ''}`}>{m.status}</span><span>{m.category}</span></div><h4>{m.title}</h4><p>{m.explanation}</p><dl><dt>Failure scenario to consider</dt><dd>{m.failureScenario}</dd><dt>How to verify it</dt><dd>{m.validation}</dd></dl><button type="button" onClick={() => setInspection(m.source)}>Read {m.source.path}:{m.source.line}</button></article>)}
      {!data.hidden_mechanics.some(m => mechanicFilter === 'All' || m.status === mechanicFilter) && <p>No findings in this filter. That does not establish that the project has no issues.</p>}</section>}
    {view === 'patterns' && <section className="explorer-patterns"><h3>The ideas behind the code</h3>{data.detected_patterns.map(p => <article key={p.id}><h4>{p.name}</h4><p>{p.plainEnglish}</p><p><strong>The problem it addresses: </strong>{p.problemPrevented}</p><button type="button" onClick={() => setInspection(p.source)}>Read the source</button><div className="explorer-practice-links">{p.exerciseIds.map(id => { const exercise = analysis.exercises.find(e => e.id === id); return exercise ? <button type="button" key={id} onClick={() => onPractice(id)}>Practice: {exercise.title}</button> : null; })}</div></article>)}{!data.detected_patterns.length && <p>No specific patterns were established in the reviewed code.</p>}
      <h3>Terms in this project</h3><dl className="explorer-glossary">{data.glossary.map(g => <div key={g.term}><dt>{g.term}</dt><dd>{g.definition}<p>{g.example}</p></dd></div>)}</dl></section>}
    {view === 'files' && <section className="explorer-files"><h3>Reviewed files</h3><p>These are saved excerpts, not a complete repository browser. Choose a file to see mapped features and inspect its code.</p><label>File<select value={filePath} onChange={e => { setFilePath(e.target.value); setInspection(null); }}>{files.map(path => <option key={path}>{path}</option>)}</select></label>
      <div>{data.screen_mapping.filter(f => f.sources.some(s => s.path === filePath)).map(f => <button type="button" key={f.id} onClick={() => { setFeatureId(f.id); setStepId(''); changeView('features'); }}>Feature: {f.feature}</button>)}</div>
      {excerpts.filter(e => e.path === filePath).map(e => <SourceInspector key={refKey(e)} source={e} excerpts={excerpts} steps={allSteps} />)}{!files.length && <p>No source excerpts are stored in this analysis.</p>}</section>}
    {source && view !== 'files' && <SourceInspector key={refKey(source)} source={source} excerpts={excerpts} steps={allSteps} />}
  </section>;
}

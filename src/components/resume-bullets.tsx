'use client';
import { useState } from 'react';
import { Check, Copy, FileCode2, FileText } from 'lucide-react';
import type { ResumeBullet } from '@/lib/model';
import { Button } from './ui/button';
export function ResumeBullets({ bullets }: { bullets: ResumeBullet[] }) {
  const [copied, setCopied] = useState(''), [error, setError] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const text = (bullet: ResumeBullet) => edits[bullet.id] ?? bullet.text;
  async function copy(id: string, value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(id); setError(''); }
    catch { setError('Clipboard is unavailable. Select and copy the bullet text directly.'); }
  }
  return <section className="resume-section"><div className="resume-intro card"><div><FileText size={24} /><h3>Turn the implementation into technical resume language.</h3><p>Use only bullets that reflect your own contribution. Review the source references and edit the wording to match what you built. Metrics, deployment results, and individual ownership are not inferred from code.</p></div>{bullets.length > 0 && <Button variant="secondary" onClick={() => copy('all', bullets.map(bullet => `- ${text(bullet)}`).join('\n'))}><Copy size={15} />{copied === 'all' ? 'Copied all bullets' : 'Copy all bullets'}</Button>}</div>
    <p className="sr-only" role="status">{copied ? copied === 'all' ? 'All resume bullets copied.' : 'Resume bullet copied.' : ''}</p>{error && <p className="form-error" role="alert">{error}</p>}
    {bullets.length === 0 ? <div className="card processing"><FileText size={28} /><h3>Generate bullets for this project</h3><p>Request a fresh analysis from Analysis history to generate technical resume bullets from the uploaded source.</p></div> : <ul className="resume-bullet-list">{bullets.map((bullet, index) => <li className="card resume-bullet-card" key={bullet.id}><div className="resume-bullet-heading"><span className="badge neutral">{bullet.category}</span><span className="small-muted">Bullet {index + 1}</span><Button variant="ghost" size="sm" aria-label={`Copy resume bullet ${index + 1}`} onClick={() => copy(bullet.id, `- ${text(bullet)}`)}>{copied === bullet.id ? <Check size={15} /> : <Copy size={15} />}{copied === bullet.id ? 'Copied' : 'Copy'}</Button></div><label className="sr-only" htmlFor={`resume-${bullet.id}`}>Edit resume bullet {index + 1}</label><textarea id={`resume-${bullet.id}`} rows={3} value={text(bullet)} maxLength={1500} onChange={event => { setEdits({ ...edits, [bullet.id]: event.target.value }); setCopied(''); }} className="resume-bullet-editor" /><div className="exercise-topic-tags">{bullet.technologies.map(technology => <span key={technology}>{technology}</span>)}</div><details className="resume-evidence"><summary><FileCode2 size={14} />Code supporting this bullet</summary><code>{bullet.evidence.path}:{bullet.evidence.line}</code><p>The file supports the implementation described. Confirm that the contribution is yours before adding it to a resume.</p></details></li>)}</ul>}
  </section>;
}

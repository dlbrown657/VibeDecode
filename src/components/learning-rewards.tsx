'use client';
import { useEffect, useState } from 'react';
import { Award, ArrowRight, Check } from 'lucide-react';
import { addCompletion, learningEvent, readCompletions, validCompletion, type Completion } from '@/lib/learning-rewards';
import { Button } from './ui/button';
const milestones = [{ count: 1, name: 'First decode' }, { count: 3, name: 'Pattern builder' }, { count: 5, name: 'Code confidence' }];
export function LearningRewards({ scope, onPractice }: { scope: string; onPractice: () => void }) {
  const key = `videdecode-learning:${scope}`;
  const [items, setItems] = useState<Completion[]>([]), [enabled, setEnabled] = useState(true), [ready, setReady] = useState(false), [message, setMessage] = useState('');
  useEffect(() => {
    try { setItems(readCompletions(localStorage.getItem(key))); setEnabled(localStorage.getItem(`${key}:enabled`) !== 'false'); } catch { /* session-only fallback */ }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(items)); localStorage.setItem(`${key}:enabled`, String(enabled)); } catch { /* the current session still works */ }
  }, [items, enabled, ready, key]);
  useEffect(() => {
    function complete(event: Event) {
      const item = (event as CustomEvent<unknown>).detail;
      if (!ready || !enabled || !validCompletion(item)) return;
      setItems(current => addCompletion(current, item));
    }
    window.addEventListener(learningEvent, complete);
    return () => window.removeEventListener(learningEvent, complete);
  }, [ready, enabled]);
  const next = milestones.find(milestone => items.length < milestone.count);
  return <section className="learning-rewards card" aria-label="Learning rewards"><div className="rewards-top"><span className="reward-symbol"><Award size={23} /></span><div><span className="eyebrow">Small wins. Real understanding.</span><h3>Your learning progress</h3><p>Earn 10 points the first time a coding answer passes or a source excerpt matches. Repeat attempts on the same exercise add no points.</p></div><Button size="sm" variant="secondary" onClick={onPractice}>Keep learning <ArrowRight size={14} /></Button></div>{enabled && <><div className="rewards-progress"><strong>{items.length * 10}<small>learning points</small></strong><div><label htmlFor={`learning-goal-${scope}`}>{next ? `${Math.min(items.length, next.count)} / ${next.count} exercises toward ${next.name}` : 'All three starter milestones earned'}</label><progress id={`learning-goal-${scope}`} max={next?.count ?? 5} value={Math.min(items.length, next?.count ?? 5)} /></div></div><ul className="reward-badges">{milestones.map(milestone => <li key={milestone.name} className={items.length >= milestone.count ? 'earned' : ''}>{items.length >= milestone.count ? <Check size={13} /> : <Award size={13} />}<span>{milestone.name}</span><small>{items.length >= milestone.count ? 'Earned' : `${milestone.count} completed`}</small></li>)}</ul></>}<details className="reward-controls"><summary>Reward preferences & data</summary><label><input type="checkbox" checked={enabled} onChange={event => { setEnabled(event.target.checked); setMessage(event.target.checked ? 'Learning rewards enabled.' : 'Learning rewards disabled. Practice still works.'); }} />Enable learning rewards in this browser</label><p>Optional, browser-local progress. Points have no cash value, do not unlock paid features, and never expire for missing a day. You can practice with rewards turned off.</p><Button size="sm" variant="ghost" onClick={() => { setItems([]); setMessage('Learning points and milestones reset in this browser.'); }}>Reset learning progress</Button></details><span className="sr-only" role="status">{message}{enabled ? ` ${items.length * 10} learning points.` : ''}</span></section>;
}

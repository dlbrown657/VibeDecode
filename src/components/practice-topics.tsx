'use client';
import { practiceTopics, type PracticeTopic } from '@/lib/model';
import { countTopics, type TopicItem } from '@/lib/practice-topics';
const descriptions: Record<PracticeTopic, string> = {
  Design: 'Practice component boundaries, data flow, scheduling, and architecture trade-offs found in this project.',
  Frontend: 'Work on UI state, filtering, rendering, forms, and accessibility patterns from this project.',
  Backend: 'Practice request validation, event processing, authorization, and service logic from this project.',
  Database: 'Explore tenant scoping, uniqueness rules, queries, relationships, and persistence patterns from this project.',
  Testing: 'Practice assertions, edge cases, regression checks, and test logic tied to this project.',
  Debugging: 'Investigate symptoms, repair logic, and prevent regressions using this project’s code patterns.',
  Algorithms: 'Practice the data structures and algorithmic patterns present in this project.',
};
export function PracticeTopics({ items, selected, onChange }: { items: TopicItem[]; selected: PracticeTopic | 'All'; onChange: (topic: PracticeTopic | 'All') => void }) {
  const counts = countTopics(items);
  return <section className="practice-topics" aria-label="Practice topics"><div className="topics-heading"><h3>Choose a topic</h3><span>Based on this project’s code</span></div><div className="topic-filters" role="group" aria-label="Filter practice by topic">{(['All', ...practiceTopics] as const).map(topic => <button key={topic} type="button" aria-pressed={selected === topic} onClick={() => onChange(topic)} className={selected === topic ? 'selected' : ''}>{topic === 'All' ? 'All topics' : topic}<span>{topic === 'All' ? items.length : counts[topic]}</span></button>)}</div><p role="status">{selected === 'All' ? 'Choose a topic, then solve a coding challenge, investigate a bug, or rewrite a source excerpt. Categories reflect the exercises available in the selected practice mode.' : descriptions[selected]}</p></section>;
}

import { practiceTopics, type PracticeTopic } from './model';
export type TopicItem = { topics?: PracticeTopic[]; evidence: { path: string }; pattern?: string };
// Old analyses have no topic metadata. Conservative path-based fallback keeps them usable.
export function topicsFor(item: TopicItem): PracticeTopic[] {
  if (item.topics?.length) return [...new Set(item.topics)];
  const path = item.evidence.path.toLowerCase();
  if (/(^|\/)(__tests__|tests?|specs?)(\/|$)|\.(test|spec)\./.test(path)) return ['Testing'];
  if (/\.(sql|prisma)$|(^|\/)(db|database|migrations|models)(\/|$)/.test(path)) return ['Database'];
  if (/\.(tsx|jsx|vue|svelte|css|scss|html)$|(^|\/)(components|screens|pages|hooks)(\/|$)/.test(path)) return ['Frontend'];
  if (/(^|\/)(api|server|workers?|services|cache|events)(\/|$)/.test(path)) return ['Backend'];
  return item.pattern ? ['Algorithms'] : [];
}
export function filterTopic<T extends TopicItem>(items: T[], topic: PracticeTopic | 'All'): T[] {
  return topic === 'All' ? items : items.filter(item => topicsFor(item).includes(topic));
}
export function countTopics(items: TopicItem[]) {
  return Object.fromEntries(practiceTopics.map(topic => [topic, filterTopic(items, topic).length])) as Record<PracticeTopic, number>;
}

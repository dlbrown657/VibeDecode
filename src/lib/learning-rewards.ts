export type CompletionKind = 'code' | 'debug' | 'recall';
export type Completion = { id: string; kind: CompletionKind; completedAt: number };
export const learningEvent = 'videdecode:completed';
export function validCompletion(value: unknown): value is Completion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Completion>;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 256 && ['code', 'debug', 'recall'].includes(item.kind ?? '') && typeof item.completedAt === 'number' && Number.isFinite(item.completedAt) && item.completedAt > 0;
}
export function readCompletions(raw: string | null): Completion[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter(validCompletion).filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).slice(-500);
  } catch { return []; }
}
export function addCompletion(items: Completion[], item: Completion): Completion[] {
  if (!validCompletion(item) || items.some(existing => existing.id === item.id)) return items;
  return [...items, item].slice(-500);
}
export function emitLearningCompletion(id: string, kind: CompletionKind) {
  window.dispatchEvent(new CustomEvent<Completion>(learningEvent, { detail: { id, kind, completedAt: Date.now() } }));
}

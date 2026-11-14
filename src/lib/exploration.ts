import { z } from 'zod';

const text = z.string().min(1).max(1800);
export const sourceRangeSchema = z.object({ path: z.string().min(1).max(300), line: z.number().int().min(1), endLine: z.number().int().min(1) });
const explanation = {
  what: text, how: text, likelyReason: text, tradeoff: text, ifBroken: text,
};
export const explorationSchema = z.object({
  screen_mapping: z.array(z.object({ id: text, feature: text, visibleResult: text, confidence: z.enum(['Source-backed', 'Inferred']), sources: z.array(sourceRangeSchema).min(1).max(8) })).max(8),
  data_flow_steps: z.array(z.object({ featureId: text, steps: z.array(z.object({ id: text, title: text, layer: z.enum(['Interface', 'API', 'Service', 'Database', 'External service', 'Background job', 'Logic']), ...explanation, source: sourceRangeSchema, connection: z.enum(['Source-backed', 'Inferred']), connectionReason: text })).min(1).max(8) })).max(8),
  topology: z.object({
    nodes: z.array(z.object({ id: text, label: text, layer: text, source: sourceRangeSchema })).max(16),
    edges: z.array(z.object({ from: text, to: text, label: text, confidence: z.enum(['Source-backed', 'Inferred']), reason: text, source: sourceRangeSchema })).max(24),
  }),
  detected_patterns: z.array(z.object({ id: text, name: text, plainEnglish: text, problemPrevented: text, source: sourceRangeSchema, exerciseIds: z.array(z.string()).max(6) })).max(12),
  hidden_mechanics: z.array(z.object({ id: text, title: text, category: z.enum(['Memory and cleanup', 'Security', 'Errors and edge cases', 'Caching', 'Background work']), status: z.enum(['Found', 'Potential concern', 'Not verified']), explanation: text, failureScenario: text, validation: text, source: sourceRangeSchema })).max(16),
  glossary: z.array(z.object({ term: text, definition: text, example: text })).max(16),
});
export const sourceExcerptSchema = sourceRangeSchema.extend({ language: z.string(), code: z.string().max(6000) });
export type Exploration = z.infer<typeof explorationSchema>;
export type SourceRange = z.infer<typeof sourceRangeSchema>;
export type SourceExcerpt = z.infer<typeof sourceExcerptSchema>;
export const blockExplanationSchema = z.object({ context: text, consequences: text });
export type BlockExplanation = z.infer<typeof blockExplanationSchema>;

export function explorationRanges(value: Exploration): SourceRange[] {
  return [...value.screen_mapping.flatMap(f => f.sources), ...value.data_flow_steps.flatMap(f => f.steps.map(s => s.source)),
    ...value.topology.nodes.map(n => n.source), ...value.topology.edges.map(e => e.source), ...value.detected_patterns.map(p => p.source), ...value.hidden_mechanics.map(m => m.source)];
}

export function validateExploration(value: Exploration, excerpts: SourceExcerpt[], exerciseIds: string[]) {
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (!unique(value.screen_mapping.map(f => f.id)) || !unique(value.topology.nodes.map(n => n.id)) || !unique(value.data_flow_steps.map(f => f.featureId)) ||
    !unique(value.detected_patterns.map(p => p.id)) || !unique(value.hidden_mechanics.map(m => m.id)) || !unique(value.glossary.map(g => g.term.toLowerCase()))) throw new Error('Duplicate explorer IDs.');
  for (const range of explorationRanges(value)) {
    if (range.endLine < range.line || !excerpts.some(e => e.path === range.path && range.line >= e.line && range.endLine <= e.endLine)) throw new Error('Explorer source is outside reviewed excerpts.');
  }
  const nodes = new Set(value.topology.nodes.map(n => n.id));
  if (value.topology.edges.some(e => !nodes.has(e.from) || !nodes.has(e.to))) throw new Error('Explorer edge refers to an unknown node.');
  if (value.data_flow_steps.some(f => !value.screen_mapping.some(s => s.id === f.featureId) || !unique(f.steps.map(s => s.id)))) throw new Error('Explorer flow refers to an unknown feature or duplicate step.');
  if (value.detected_patterns.some(p => p.exerciseIds.some(id => !exerciseIds.includes(id)))) throw new Error('Explorer pattern refers to an unknown exercise.');
}

export function selectedSource(excerpts: SourceExcerpt[], range: SourceRange) {
  const valid = sourceRangeSchema.safeParse(range);
  if (!valid.success || range.endLine < range.line || range.endLine - range.line >= 35) throw new Error('Select between 1 and 35 reviewed lines.');
  const excerpt = excerpts.find(e => e.path === range.path && range.line >= e.line && range.endLine <= e.endLine);
  if (!excerpt) throw new Error('Selected code is outside the saved reviewed excerpts.');
  const code = excerpt.code.split(/\r?\n/).slice(range.line - excerpt.line, range.endLine - excerpt.line + 1).join('\n');
  if (!code.trim()) throw new Error('Select a nonempty code block.');
  return { excerpt, code };
}

import { expect, it } from 'vitest';
import { analysisSchema } from '../src/lib/model';
import { hybridSampleAnalysis, sampleAnalysis } from '../src/lib/sample';
import { explorationSchema, selectedSource, validateExploration, explorationRanges } from '../src/lib/exploration';

const sample = hybridSampleAnalysis;
const exploration = sample.exploration!;
const excerpts = sample.sourceExcerpts!;
const exerciseIds = sample.exercises.map(e => e.id);

it('saves an explorer that references only actual sample excerpts and available practice', () => {
  expect(analysisSchema.safeParse(sample).success).toBe(true);
  expect(() => validateExploration(exploration, excerpts, exerciseIds)).not.toThrow();
  for (const range of explorationRanges(exploration)) expect(selectedSource(excerpts, range).code.trim()).not.toBe('');
  expect(exploration.data_flow_steps.some(f => f.steps.some(s => s.connection === 'Inferred'))).toBe(true);
  expect(exploration.hidden_mechanics.some(m => m.status === 'Not verified')).toBe(true);
  expect(exploration.glossary.length).toBeGreaterThan(0);
});

it('keeps older analyses readable without inventing a feature map', () => {
  const legacy = analysisSchema.parse({ ...sampleAnalysis, exploration: undefined, sourceExcerpts: undefined });
  expect(legacy.exploration).toBeUndefined();
  expect(legacy.sourceExcerpts).toBeUndefined();
});

it('rejects reversed, invented and out-of-window references', () => {
  const copy = structuredClone(exploration);
  copy.screen_mapping[0].sources[0].path = 'missing.tsx';
  expect(() => validateExploration(copy, excerpts, exerciseIds)).toThrow('outside');
  copy.screen_mapping[0].sources[0] = { path: excerpts[0].path, line: excerpts[0].line + 1, endLine: excerpts[0].line };
  expect(() => validateExploration(copy, excerpts, exerciseIds)).toThrow('outside');
});

it('rejects dangling graph endpoints, missing feature IDs and nonexistent practice links', () => {
  const graph = structuredClone(exploration); graph.topology.edges[0].to = 'unknown';
  expect(() => validateExploration(graph, excerpts, exerciseIds)).toThrow('unknown node');
  const flow = structuredClone(exploration); flow.data_flow_steps[0].featureId = 'unknown';
  expect(() => validateExploration(flow, excerpts, exerciseIds)).toThrow('unknown feature');
  const pattern = structuredClone(exploration); pattern.detected_patterns[0].exerciseIds = ['invented'];
  expect(() => validateExploration(pattern, excerpts, exerciseIds)).toThrow('unknown exercise');
});

it('rejects duplicate node IDs, feature IDs, step IDs and findings', () => {
  const node = structuredClone(exploration); node.topology.nodes.push(node.topology.nodes[0]);
  expect(() => validateExploration(node, excerpts, exerciseIds)).toThrow('Duplicate');
  const flow = structuredClone(exploration); flow.data_flow_steps[0].steps.push(flow.data_flow_steps[0].steps[0]);
  expect(() => validateExploration(flow, excerpts, exerciseIds)).toThrow('duplicate step');
  const mechanics = structuredClone(exploration); mechanics.hidden_mechanics.push(mechanics.hidden_mechanics[0]);
  expect(() => validateExploration(mechanics, excerpts, exerciseIds)).toThrow('Duplicate');
});

it('extracts exact selected lines without accepting source text from the caller', () => {
  const e = excerpts[0];
  expect(selectedSource(excerpts, { path: e.path, line: e.line, endLine: e.line }).code).toBe(e.code.split('\n')[0]);
  expect(() => selectedSource(excerpts, { path: e.path, line: 0, endLine: 1 })).toThrow();
  expect(() => selectedSource(excerpts, { path: e.path, line: e.line, endLine: e.line + 35 })).toThrow('1 and 35');
  expect(() => selectedSource(excerpts, { path: 'elsewhere', line: 1, endLine: 1 })).toThrow('outside');
  expect(() => selectedSource([{ path: 'empty', line: 1, endLine: 1, code: '  ', language: 'Text' }], { path: 'empty', line: 1, endLine: 1 })).toThrow('nonempty');
});


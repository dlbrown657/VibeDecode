import type { RecallExercise } from './model';
export const sampleRecallExercises: RecallExercise[] = [
  { id: 'recall-dedup', title: 'Remember the event deduplicator', kind: 'Core logic', language: 'TypeScript', evidence: { path: 'src/events/deduplicate.ts', line: 12 }, endLine: 19,
    code: 'export function removeDuplicateDeliveries(deliveries: Delivery[]): Delivery[] {\n  const seen = new Set<string>();\n  return deliveries.filter(delivery => {\n    if (seen.has(delivery.id)) return false;\n    seen.add(delivery.id);\n    return true;\n  });\n}',
    whatItDoes: 'Filters incoming delivery objects by their IDs, remembering which IDs it has seen. It returns the first delivery for each ID in the original order.',
    whyNeeded: 'Services may deliver the same event more than once. This batch-level helper prevents repeat entries from reaching the next processing step. A persistent uniqueness rule is still needed across requests and workers.',
    steps: ['Create a set for membership checks.', 'Filter the incoming deliveries by their IDs.', 'Reject an ID that has already been seen.', 'Remember each accepted ID and keep the original delivery order.'] },
  { id: 'recall-cache', title: 'Remember the cache expiry check', kind: 'Supporting code', language: 'TypeScript', evidence: { path: 'src/cache/feed.ts', line: 35 }, endLine: 38,
    code: 'export function isExpired(createdAtSeconds: number, ttlSeconds: number, nowMs: number): boolean {\n  const expiresAtMs = (createdAtSeconds + ttlSeconds) * 1000;\n  return nowMs >= expiresAtMs;\n}',
    whatItDoes: 'Calculates when a cached value expires and checks whether the current time has reached that point. It converts seconds to milliseconds before comparing.',
    whyNeeded: 'The feed should not serve old data indefinitely. This small supporting function keeps time units consistent and makes the exact expiry boundary easy to test.',
    steps: ['Add the time-to-live to the creation time.', 'Convert the expiry time from seconds to milliseconds.', 'Use an inclusive comparison so an entry expires at the boundary.'] },
  { id: 'recall-python', title: 'Remember the event normalization helper', kind: 'Supporting code', language: 'Python', evidence: { path: 'workers/enrich.py', line: 8 }, endLine: 13,
    code: 'def normalize_amount(event):\n    raw_amount = event.get("amount", 0)\n    try:\n        return max(0.0, float(raw_amount))\n    except (TypeError, ValueError):\n        return 0.0',
    whatItDoes: 'Reads an amount from an event, converts it to a number, prevents negative values, and returns zero when the value cannot be converted.',
    whyNeeded: 'External services can send missing or malformed values. A normalization helper gives the rest of the enrichment worker a consistent fallback for these cases. Real financial or strict-schema processing may need validation errors instead of a fallback.',
    steps: ['Read the amount with a default for a missing key.', 'Try to convert it and clamp negative values to zero.', 'Handle type and value conversion failures explicitly.'] },
];
// These are curated demo excerpts, not source from an uploaded repository.
export const sampleRecallSources = sampleRecallExercises.map(exercise => ({ path: exercise.evidence.path, language: exercise.language, content: '\n'.repeat(exercise.evidence.line - 1) + exercise.code }));

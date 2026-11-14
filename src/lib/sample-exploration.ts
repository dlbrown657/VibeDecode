import type { Analysis } from './model';
import { type Exploration, type SourceExcerpt } from './exploration';

export function sampleExploration(original: Analysis): { exploration: Exploration; sourceExcerpts: SourceExcerpt[] } {
  const contexts = [...original.exercises, ...(original.debugChallenges ?? [])].flatMap(e => e.sourceContext ? [e.sourceContext] : []);
  const sourceExcerpts = [...new Map(contexts.map(c => [`${c.evidence.path}:${c.evidence.line}`, { path: c.evidence.path, line: c.evidence.line, endLine: c.endLine, code: c.code, language: c.language }])).values()];
  const source = (path: string) => { const c = sourceExcerpts.find(e => e.path === path)!; return { path: c.path, line: c.line, endLine: c.endLine }; };
  const feed = source('src/components/EventFeed.tsx'), ingest = source('src/api/ingest.ts'), database = source('db/schema.sql'), dedupe = source('src/events/deduplicate.ts');
  const clock = sourceExcerpts.find(e => e.code.includes('expiresAtMs'))!;
  const cache = { path: clock.path, line: clock.line, endLine: clock.endLine };
  const exploration: Exploration = {
    screen_mapping: [
      { id: 'search', feature: 'Search the activity feed', visibleResult: 'Matching event titles remain visible as the supplied query changes.', confidence: 'Source-backed', sources: [feed] },
      { id: 'delivery', feature: 'Accept an event delivery', visibleResult: 'A background capability: validate an incoming event and write it using a team-scoped identity. No screen is shown in this excerpt.', confidence: 'Source-backed', sources: [ingest, database] },
      { id: 'duplicates', feature: 'Remove repeated deliveries', visibleResult: 'A helper keeps the first delivery for each ID inside one batch. Its caller is not shown.', confidence: 'Source-backed', sources: [dedupe] },
    ],
    data_flow_steps: [
      { featureId: 'search', steps: [
        { id: 'query', title: 'Normalize the query', layer: 'Interface', source: { ...feed, endLine: feed.line + 1 }, connection: 'Source-backed', connectionReason: 'The component receives query as a prop and calls trim and toLowerCase directly.', what: 'Remove extra spaces and ignore letter case when searching.', how: 'The component builds one lowercase search term before filtering the event titles.', likelyReason: 'This likely makes searches such as “ DEPLOY ” behave like “deploy”. The original author’s intent is not known.', tradeoff: 'A substring match is simple but does not rank results or handle fuzzy spelling.', ifBroken: 'Removing normalization may cause spaces or letter case to hide otherwise matching results.' },
        { id: 'render', title: 'Filter and render titles', layer: 'Interface', source: { ...feed, line: feed.line + 2 }, connection: 'Source-backed', connectionReason: 'The filter uses term from the previous line; the returned list maps the visible array.', what: 'Keep matching events and show each title in a list.', how: 'filter tests each title; map turns the retained events into list items with stable event IDs as keys.', likelyReason: 'Deriving the visible list from props avoids maintaining a second copy of the same data.', tradeoff: 'The component scans the supplied events on each render. Measure before adding memoization or server search.', ifBroken: 'A broken filter may show no events or unrelated events. A broken render can prevent the list from appearing.' },
      ] },
      { featureId: 'delivery', steps: [
        { id: 'validate', title: 'Validate the incoming event', layer: 'API', source: { ...ingest, endLine: ingest.line + 1 }, connection: 'Source-backed', connectionReason: 'acceptEvent receives event and passes it directly to eventSchema.parse.', what: 'Reject input that does not satisfy the configured event schema.', how: 'eventSchema.parse produces parsed data or throws. The schema definition and error response are outside this excerpt.', likelyReason: 'Validation likely keeps malformed values away from persistence.', tradeoff: 'A schema protects shape and rules it defines; it does not establish the caller’s permission.', ifBroken: 'Malformed data may reach storage if validation is removed. The exact client error behavior is not visible here.' },
        { id: 'write', title: 'Persist by team and event ID', layer: 'Service', source: { ...ingest, line: ingest.line + 2 }, connection: 'Source-backed', connectionReason: 'The upsert call reads parsed.id and parsed.amount from the preceding parse result.', what: 'Write the validated event under its team and stable event identity.', how: 'The helper calls db.events.upsert with teamId, eventId and amount. The database adapter is not included.', likelyReason: 'Stable identity can support safe retries when the persistence adapter and constraints implement it correctly.', tradeoff: 'The call alone does not prove atomic retry handling or downstream side-effect protection.', ifBroken: 'Deliveries may fail to save. Incorrect identity handling may duplicate or overwrite events; adapter behavior needs testing.' },
        { id: 'constraint', title: 'Enforce scoped uniqueness', layer: 'Database', source: database, connection: 'Inferred', connectionReason: 'The sample SQL and helper share team/event identity concepts, but the adapter connecting db.events to this table is not supplied.', what: 'Prevent the same team/event pair from appearing twice.', how: 'The sample SQL defines a composite uniqueness rule. Both fields together identify a delivery.', likelyReason: 'A database rule can protect an invariant even when requests arrive together.', tradeoff: 'Applications must handle conflicting writes deliberately.', ifBroken: 'Concurrent deliveries could store duplicates if no other protection exists. Verify with a concurrent database test.' },
      ] },
      { featureId: 'duplicates', steps: [
        { id: 'remember', title: 'Remember IDs already seen', layer: 'Logic', source: dedupe, connection: 'Source-backed', connectionReason: 'The filter callback checks and updates the local seen Set in the same function.', what: 'Keep the first delivery with each ID and preserve its position.', how: 'A Set acts as a checklist. Seen IDs are rejected; new IDs are recorded before the delivery is retained.', likelyReason: 'Set membership avoids repeatedly searching the growing output array.', tradeoff: 'The set uses memory and protects only this batch. It does not coordinate multiple workers.', ifBroken: 'Repeated IDs may appear more than once, or an inverted condition may remove every first occurrence.' },
      ] },
    ],
    topology: {
      nodes: [{ id: 'feed', label: 'Activity feed', layer: 'Interface', source: feed }, { id: 'ingest', label: 'Event intake', layer: 'API', source: ingest }, { id: 'db', label: 'Event storage', layer: 'Database', source: database }, { id: 'dedupe', label: 'Batch deduplication', layer: 'Logic', source: dedupe }, { id: 'cache', label: 'Expiry helper', layer: 'Service', source: cache }],
      edges: [
        { from: 'ingest', to: 'db', label: 'Store a validated event', confidence: 'Inferred', reason: 'The intake calls a database adapter, but its link to this SQL table is not visible.', source: ingest },
        { from: 'db', to: 'feed', label: 'Supply feed events', confidence: 'Inferred', reason: 'The feed accepts events as props; the fetch and subscription paths are not supplied.', source: feed },
      ],
    },
    detected_patterns: [
      { id: 'membership', name: 'Hash-set membership', plainEnglish: 'A checklist answers whether an event ID has already appeared.', problemPrevented: 'Avoids repeated linear searches while deduplicating a batch.', source: dedupe, exerciseIds: ['coding-unique'] },
      { id: 'scope', name: 'Composite uniqueness', plainEnglish: 'Team ID and event ID form one unique pair.', problemPrevented: 'Lets separate teams use the same event ID while rejecting duplicates within a team.', source: database, exerciseIds: ['coding-tenant'] },
      { id: 'filter', name: 'Derived UI data', plainEnglish: 'The displayed list is calculated from events and the current search term.', problemPrevented: 'Avoids an independently stored filtered list drifting out of sync.', source: feed, exerciseIds: ['coding-filter'] },
    ],
    hidden_mechanics: [
      { id: 'validation', title: 'Input validation before writing', category: 'Security', status: 'Found', explanation: 'The intake parses the event before calling storage. This does not establish authentication or authorization.', failureScenario: 'Malformed input causes parsing to throw; the response handler is not shown.', validation: 'Test invalid and oversized events at the real HTTP boundary.', source: ingest },
      { id: 'permission', title: 'Where team permissions are checked', category: 'Security', status: 'Not verified', explanation: 'teamId is passed into this helper. The caller and permission checks are outside the saved excerpt.', failureScenario: 'A caller-supplied team ID could be unsafe if the surrounding route fails to authorize it.', validation: 'Find the route and verify cross-team requests are rejected.', source: ingest },
      { id: 'empty', title: 'Empty search behavior', category: 'Errors and edge cases', status: 'Found', explanation: 'A whitespace-only query normalizes to an empty string. Every title includes that string, so all supplied events remain visible.', failureScenario: 'A missing or non-string query violates the helper’s expected input; runtime validation is not visible.', validation: 'Test empty, whitespace-only and mixed-case queries, plus the prop boundary.', source: feed },
      { id: 'cleanup', title: 'Listener and subscription cleanup', category: 'Memory and cleanup', status: 'Not verified', explanation: 'This excerpt does not create a listener or subscription. Other components and hooks are not represented.', failureScenario: 'An uncleaned subscription elsewhere could keep resources alive after navigation.', validation: 'Inspect subscription owners and repeat mount/unmount while checking active listeners.', source: feed },
      { id: 'clock', title: 'Expiry time units', category: 'Caching', status: 'Found', explanation: 'The sample expiry helper converts seconds to milliseconds before comparing against the supplied clock.', failureScenario: 'Mixing units can expire entries too early or keep them too long.', validation: 'Test immediately before, exactly at, and immediately after expiry.', source: cache },
    ],
    glossary: [
      { term: 'Idempotency', definition: 'Repeating a request has the same intended effect as doing it once.', example: 'A retried delivery should not create a second stored event.' },
      { term: 'Upsert', definition: 'A storage operation that inserts or updates according to its configured identity rules.', example: 'The intake calls an upsert adapter; inspect that adapter to establish its exact conflict behavior.' },
      { term: 'Composite uniqueness', definition: 'A rule that treats several values together as a unique identity.', example: 'Team A and Team B can each have event 7; Team A cannot store event 7 twice.' },
      { term: 'Derived state', definition: 'A value calculated from existing inputs instead of stored separately.', example: 'The visible event list is calculated from events and the search term.' },
    ],
  };
  return { exploration, sourceExcerpts };
}

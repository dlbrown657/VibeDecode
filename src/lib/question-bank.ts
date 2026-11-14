import type { Analysis, FileMetric } from './model';

export type BankInterview = { id: string; kind: 'interview'; language?: string; tags: string[]; question: string; answer: string; tradeoff: string };
type Row = [string, string, string, string];
// Original study questions. Tags are for retrieval, not claims about a repository.
const shared: Row[] = [
  ['boundary,design', 'How do you choose a module boundary?', 'Group code that changes for the same reason. Give callers a small contract and keep implementation details private.', 'Extra layers help independent changes but add navigation and maintenance.'],
  ['api,validation', 'Where should request validation happen?', 'Validate untrusted input at the server boundary before side effects. Validate shape, limits and domain rules; client checks help usability.', 'Repeated checks cost effort, but client validation cannot enforce server trust.'],
  ['auth,security', 'How do authentication and authorization differ?', 'Authentication identifies a caller. Authorization decides what that caller may do to a particular resource. Check both on each protected request.', 'Central policies reduce duplication but still need resource-specific context.'],
  ['database,sql', 'Why use a database transaction?', 'A transaction groups writes so they commit together or roll back together. Choose isolation based on the invariant and test concurrent requests.', 'Stronger isolation can cause contention and retries.'],
  ['database,unique', 'Why enforce uniqueness in the database?', 'Two callers can both pass an application lookup. A unique constraint rejects the conflicting write atomically; handle that conflict explicitly.', 'Constraints protect invariants but need deliberate error handling and migration planning.'],
  ['cache,performance', 'How would you invalidate cached data?', 'Define acceptable staleness, include scope in the key, and invalidate or version entries when authoritative data changes.', 'Short expiry improves freshness but increases work at the source.'],
  ['retry,event', 'What makes an operation idempotent?', 'Repeating an operation has the same intended effect as performing it once. Persist a stable request key with the result or protected write.', 'Tracking keys needs storage and a retention policy.'],
  ['queue,concurrency', 'How do you handle a growing job queue?', 'Measure arrival rate, processing rate and oldest-job age. Bound concurrency, retry with limits, and reject or defer work when capacity is exhausted.', 'More workers can overload downstream services.'],
  ['error,api', 'What should an API error reveal?', 'Return an actionable stable error code and safe message. Keep private diagnostics in access-controlled logs with a correlation ID.', 'Detailed client errors help debugging but may expose internal data.'],
  ['testing,test', 'What makes a regression test useful?', 'Reproduce the observed failure, assert externally visible behavior, and confirm the test fails before the fix and passes afterward.', 'Broad tests catch integration failures but are slower and harder to diagnose.'],
  ['testing,time', 'How do you test time-dependent behavior?', 'Inject a clock and test before, exactly at, and after each boundary. Make units and timezone assumptions explicit.', 'A fake clock makes tests repeatable but does not simulate every scheduling failure.'],
  ['debugging,error', 'How would you investigate an intermittent failure?', 'Capture a reproducible input and correlation trail, narrow competing hypotheses, and change one variable at a time before adding a regression check.', 'More diagnostics help, but logs need cost limits and sensitive-data controls.'],
  ['performance,complexity', 'How would you justify a performance improvement?', 'State the expected complexity change, benchmark realistic inputs, and verify output equivalence. Separate measured results from predictions.', 'A faster implementation may use more memory or be harder to maintain.'],
  ['array,iteration', 'When is a set preferable to repeated array searches?', 'A set usually provides average constant-time membership checks; repeated linear searches can make a loop quadratic. Preserve ordering separately if needed.', 'A set uses extra memory and does not replace a database concurrency rule.'],
  ['pagination,api', 'When would you use cursor pagination?', 'Use a stable ordered key and a cursor to fetch the next range. Define tie-breaking and the consistency expected when records change.', 'Cursor pagination handles large changing lists well but makes arbitrary page jumps harder.'],
  ['frontend,state', 'Which state should be stored and which should be derived?', 'Store the minimal independent values. Derive filtered lists and totals from them so several copies cannot drift apart.', 'Expensive derivations may need measured memoization.'],
  ['frontend,accessibility', 'How would you make a form usable from the keyboard?', 'Use labels, logical focus order, visible focus, keyboard-operable controls and errors associated with the relevant fields.', 'Custom controls require more interaction testing than native controls.'],
  ['design,dependency', 'When should you inject a dependency?', 'Pass a clock, storage adapter or service where a boundary needs alternate implementations or controlled tests.', 'Too many abstractions can obscure straightforward code.'],
  ['security,secret', 'How should secrets be handled?', 'Keep secrets outside client bundles and source control. Restrict access, avoid logging values, and rotate credentials after exposure.', 'Central secret management adds operational work but supports access control and rotation.'],
  ['testing,design', 'How would you explain a design decision you would now change?', 'Describe the original constraints, the evidence that changed your view, the alternative and a small validation plan. Claim only work you actually did.', 'A migration may cost more than retaining an imperfect design.'],
];

const languages: Record<string, Row[]> = {
  'JavaScript/TypeScript': [
    ['async,promise', 'How do promises and async/await relate?', 'An async function returns a promise. Await suspends that function until settlement; catch rejection and distinguish sequential from independent work.', 'Concurrent promises reduce waiting but need bounded fan-out.'],
    ['closure,function', 'What does a closure retain?', 'A closure retains access to its lexical environment, including variables whose values may change after the function was created.', 'Closures simplify callbacks but can retain memory and stale assumptions.'],
    ['type,validation', 'Does a TypeScript type validate JSON?', 'No. Types are erased at runtime. Parse external values with runtime checks before treating them as a domain type.', 'Runtime validation adds work but protects a boundary types cannot enforce.'],
    ['array,state', 'How does a shallow copy differ from a deep copy?', 'A spread copies the outer container; nested objects remain shared. Copy the changed path when updating nested state.', 'Deep copies cost time and may not support every object type.'],
    ['event,async', 'Why can CPU-heavy JavaScript block requests?', 'Long synchronous work occupies the event loop. Break up work or move CPU-heavy jobs to workers and measure responsiveness.', 'Workers add transfer and coordination costs.'],
    ['type,null', 'How does narrowing make a union safer?', 'Check a discriminant or runtime condition before accessing members that are not shared by every variant.', 'Assertions are shorter but can hide unsupported assumptions.'],
    ['map,lookup', 'When would you choose Map over an object?', 'Map supports arbitrary keys and explicit size and iteration APIs. Objects are convenient for fixed record shapes and JSON data.', 'Maps need conversion for JSON serialization.'],
    ['error,promise', 'What happens when Promise.all rejects?', 'The combined promise rejects when an input rejects; already started operations continue unless separately cancelled.', 'Fail-fast reporting is simple, while allSettled preserves every outcome.'],
    ['react,state,frontend', 'Why use a functional React state update?', 'When the next value depends on previous state, pass an updater so queued updates use the latest pending value.', 'Derived state can often be avoided entirely.'],
    ['module,dependency', 'What belongs at a module boundary?', 'Export a narrow typed contract, keep mutable internals private, and avoid importing server-only dependencies into browser code.', 'Small public APIs ease changes but require deliberate composition.'],
  ],
  Python: [
    ['list,mutation', 'Why are mutable default arguments risky?', 'Default expressions are evaluated when the function is defined. Use None and allocate inside the function when each call needs a fresh list.', 'A shared default is sometimes intentional but must be explicit.'],
    ['generator,iteration', 'When should you use a generator?', 'Yield items as needed rather than building every result in memory. Consumers advance the iterator and may exhaust it.', 'Lazy evaluation saves memory but defers errors and may be single-use.'],
    ['dict,lookup', 'How do dictionaries help repeated lookup?', 'A dictionary maps hashable keys to values with average constant-time lookup. Define missing-key behavior and avoid accidental mutation.', 'Hash tables use memory and depend on hashing and equality contracts.'],
    ['async,concurrency', 'What does asyncio help with?', 'Asyncio coordinates cooperative tasks that yield while awaiting I/O. Blocking calls inside a coroutine still block its event loop.', 'CPU-heavy work needs a different execution strategy.'],
    ['context,file', 'Why use a context manager?', 'A with block gives a resource a defined lifetime and runs cleanup on normal exit or exceptions.', 'Cleanup itself can fail and needs an explicit policy.'],
    ['type,validation', 'Do Python type hints validate runtime input?', 'Type hints support tooling and static checking; validate untrusted values explicitly at runtime.', 'Runtime validation has cost but prevents invalid values entering domain logic.'],
    ['copy,mutation', 'What does copying a list actually copy?', 'A shallow list copy creates a new outer list but shares nested objects. Copy only the parts that need independent mutation.', 'Deep copying may duplicate too much or fail on resources.'],
    ['exception,error', 'How narrowly should you catch exceptions?', 'Catch exceptions you can handle, preserve useful context, and let unexpected failures propagate to an appropriate boundary.', 'Broad catches can hide defects; narrow catches require a clear failure contract.'],
    ['test,mock', 'Where should a Python dependency be patched in a test?', 'Patch the name where the code under test looks it up. Prefer passing dependencies when doing so makes the contract clearer.', 'Heavy patching can tie tests to implementation details.'],
    ['class,design', 'When would you choose a dataclass?', 'Use a dataclass for a data-oriented object with generated initialization and comparison. Validate invariants explicitly; annotations alone do not enforce them.', 'Frozen dataclasses prevent attribute reassignment but do not deeply freeze nested values.'],
  ],
  Java: [
    ['equals,hash,lookup', 'Why must equals and hashCode agree?', 'Equal objects must have equal hash codes so hash-based collections can find them. Use stable fields for keys.', 'Mutable equality fields can break lookups after insertion.'],
    ['collection,list', 'When would you choose ArrayList over LinkedList?', 'ArrayList offers indexed access and compact storage. Choose based on actual access and mutation patterns rather than theoretical insertion costs alone.', 'Middle insertions shift elements, while linked nodes add allocation overhead.'],
    ['optional,null', 'What is Optional useful for?', 'Optional makes an absent return value explicit. Handle absence instead of calling get without checking.', 'Using Optional everywhere adds wrappers and can complicate data models.'],
    ['exception,error', 'How do checked and unchecked exceptions differ?', 'Checked exceptions must be caught or declared. Unchecked exceptions do not have that compiler requirement; choose based on the API failure contract.', 'Checked exceptions expose recovery needs but can clutter call chains.'],
    ['resource,file', 'Why use try-with-resources?', 'It closes AutoCloseable resources on exit, including exceptional exit, and preserves suppressed cleanup failures.', 'Closing order matters when resources depend on each other.'],
    ['concurrency,thread', 'What does synchronized protect?', 'Synchronization provides mutual exclusion on a monitor and visibility between matching lock operations. All accesses to a shared invariant need a consistent protocol.', 'Coarse locks are simple but can reduce parallelism.'],
    ['stream,iteration', 'When is a stream pipeline helpful?', 'Streams express transformations and reductions. Keep operations free of shared side effects and handle resource-backed streams carefully.', 'A loop may be clearer for complex control flow; parallel streams are not automatically faster.'],
    ['generic,type', 'Why use generics?', 'Generics express reusable type relationships and catch many mismatches at compile time; most type parameters are erased at runtime.', 'Variance and wildcards can make public APIs harder to read.'],
    ['string,mutation', 'Why use StringBuilder in a loop?', 'StringBuilder accumulates mutable character content without repeatedly creating growing immutable strings.', 'A local builder is useful for repeated appends; ordinary concatenation is often clearer for small expressions.'],
    ['interface,design', 'Why depend on an interface?', 'An interface states required behavior separately from an implementation and supports substitution at a useful boundary.', 'An interface for every class can add ceremony without flexibility.'],
  ],
  'C++': [
    ['resource,memory', 'What does RAII provide?', 'Tie a resource to an object lifetime so its destructor releases it on normal scope exit and stack unwinding.', 'Ownership must still be designed; destructors should not throw during unwinding.'],
    ['pointer,ownership', 'When should you use unique_ptr?', 'Use unique_ptr for sole ownership and move it to transfer that ownership. Use raw pointers or references for clearly non-owning access.', 'Shared ownership is convenient but adds bookkeeping and risks cycles.'],
    ['vector,iteration', 'When can vector iterators become invalid?', 'Reallocation invalidates all references and iterators. Insertions and erasures can invalidate positions at or after the change even without reallocation.', 'Reserve can reduce reallocations but does not make every mutation safe.'],
    ['move,performance', 'What does std::move do?', 'It casts to an rvalue reference so a move-aware overload may be selected. It does not itself move data.', 'Moved-from objects remain valid but usually have unspecified state unless documented.'],
    ['const,type', 'What does const communicate?', 'Const restricts mutation through that access path and helps express read-only interfaces; it does not guarantee deep immutability.', 'Const-correct APIs need planning across referenced objects.'],
    ['map,lookup', 'How do map and unordered_map differ?', 'Map maintains ordered keys with logarithmic lookup. Unordered_map offers average constant-time lookup without sorted iteration.', 'Hash tables can have worse worst-case behavior and different invalidation rules.'],
    ['reference,lifetime', 'Why is returning a reference to a local variable unsafe?', 'The local object is destroyed on return, leaving a dangling reference. Return a value or reference an object with a sufficient lifetime.', 'Avoiding a copy is not worth an invalid lifetime.'],
    ['virtual,class', 'When does a base class need a virtual destructor?', 'A public base intended for deletion through a base pointer needs a virtual destructor so derived cleanup runs correctly.', 'Virtual dispatch adds runtime structure; value-based designs may avoid it.'],
    ['exception,resource', 'What is the strong exception guarantee?', 'A failed operation leaves the observable state unchanged. Prepare a new state before committing changes when practical.', 'Rollback-safe implementations may require extra memory or copying.'],
    ['template,type', 'When is a template useful?', 'Templates generate type-specific code for reusable algorithms and containers while checking operations at compile time.', 'They can increase build time and produce complex diagnostics.'],
  ],
  'C#': [
    ['async,task', 'How do Task and async/await relate?', 'Task represents eventual completion. Await composes completion without synchronously blocking the waiting thread.', 'Async methods still run synchronous work before yielding and do not automatically create a thread.'],
    ['linq,iteration', 'What does deferred LINQ execution mean?', 'Many LINQ queries run when enumerated. Re-enumerating may repeat work or see changed data; materialize deliberately when a snapshot is needed.', 'ToList gives a snapshot but allocates memory.'],
    ['dispose,resource', 'Why use a using statement?', 'Using deterministically disposes IDisposable resources even when an exception exits the scope.', 'Disposal releases resources; it does not force garbage collection.'],
    ['nullable,type', 'What do nullable reference annotations provide?', 'They let the compiler warn about potential null use. They do not replace runtime validation at external boundaries.', 'Warnings depend on annotations and can be bypassed by suppression.'],
    ['record,equality', 'When would you choose a record?', 'Records provide value-oriented equality and concise data modeling. Nested referenced values can still be mutable.', 'Value equality may be unsuitable for identity-based entities.'],
    ['struct,class', 'How do structs and classes differ?', 'Structs have value semantics and classes have reference semantics. Choose based on identity, size and mutation behavior.', 'Copying a large mutable struct can be costly and surprising.'],
    ['cancel,async', 'How should CancellationToken be used?', 'Pass the token through cancellable operations, observe it cooperatively, and distinguish cancellation from unexpected failure.', 'Cancellation is a request and does not automatically undo completed effects.'],
    ['dictionary,lookup', 'Why use TryGetValue?', 'TryGetValue handles presence and retrieves the value in one lookup without relying on exceptions for missing keys.', 'A normal dictionary still needs synchronization for concurrent mutation.'],
    ['dependency,design', 'How do service lifetimes affect dependency injection?', 'Transient services are created per resolution, scoped services per scope and singleton services for the container lifetime. Avoid capturing shorter-lived state in a singleton.', 'Long-lived services need thread-safe dependencies and bounded retained state.'],
    ['exception,error', 'Why use throw instead of throw ex when rethrowing?', 'A bare throw preserves the original exception stack trace inside a catch block.', 'Wrapping adds context but should retain the original as the inner exception.'],
  ],
  Go: [
    ['goroutine,concurrency', 'What is a goroutine?', 'A goroutine is a function scheduled concurrently by the Go runtime. Its lifetime, cancellation and shared data still need explicit management.', 'Cheap concurrency can still leak work or exhaust resources.'],
    ['channel,queue', 'When would you use a channel?', 'Channels coordinate values and synchronization between goroutines. Define who sends, who closes and when receivers stop.', 'A mutex can be simpler when protecting shared state rather than passing ownership.'],
    ['error,api', 'How should Go errors be propagated?', 'Check returned errors, add useful context with wrapping, and use errors.Is or errors.As when callers need to classify a wrapped error.', 'Too much wrapping adds noise; ignoring an error hides failure.'],
    ['defer,resource', 'When does a deferred function run?', 'A defer runs when the surrounding function returns, in last-in first-out order. Its call arguments are evaluated when defer is registered.', 'Deferring cleanup inside a long loop may retain resources until the whole function returns.'],
    ['slice,mutation', 'How can two slices share data?', 'A slice describes a range in a backing array. Sub-slices may share that array; append may reuse capacity or allocate another array.', 'Copy explicitly when independent mutation is required.'],
    ['interface,type', 'How are Go interfaces satisfied?', 'A type satisfies an interface implicitly through its method set. Keep interfaces small and define them near their consumers.', 'Value and pointer receiver method sets differ.'],
    ['context,cancel', 'What belongs in context.Context?', 'Use context for cancellation, deadlines and request-scoped values. Pass it explicitly and do not use it as an optional-argument bag.', 'Cancellation only works when downstream operations observe it.'],
    ['map,concurrency', 'Can goroutines freely mutate the same map?', 'Ordinary maps require synchronization when concurrent access includes writes. Use a mutex or an appropriate concurrency-safe design.', 'A single lock is easy to reason about but can become contended.'],
    ['test,table', 'Why use table-driven tests?', 'List inputs and expected outcomes as named cases, then run the same assertion logic for each, including boundary and error cases.', 'Shared test helpers should not hide what each case proves.'],
    ['nil,interface', 'Why can an interface holding a nil pointer be non-nil?', 'An interface contains a dynamic type and value. A typed nil pointer has a type, so the interface itself is not nil.', 'Return a nil interface deliberately when an API means no error or no value.'],
  ],
};

export const interviewBank: BankInterview[] = [
  ...shared.map(([tags, question, answer, tradeoff], i): BankInterview => ({ id: `shared-${i + 1}`, kind: 'interview', tags: tags.split(','), question, answer, tradeoff })),
  ...Object.entries(languages).flatMap(([language, rows], group) => rows.map(([tags, question, answer, tradeoff], i): BankInterview => ({ id: `language-${group + 1}-${i + 1}`, kind: 'interview', language, tags: tags.split(','), question, answer, tradeoff }))),
];

export function languageMatches(bankLanguage: string | undefined, language: string) {
  return !bankLanguage || (bankLanguage === 'JavaScript/TypeScript' ? ['JavaScript', 'TypeScript'].includes(language) : bankLanguage === language);
}
export type MatchContext = { path: string; line: number; text: string; language: string };
export function matchContexts(files: FileMetric[], findings: { path: string; line: number; purpose: string; concepts: string[]; patterns: string[] }[]): MatchContext[] {
  return findings.flatMap(f => {
    const file = files.find(m => m.path === f.path);
    return file && f.line >= 1 && f.line <= file.lines ? [{ path: f.path, line: f.line, language: file.language, text: [f.purpose, ...f.concepts, ...f.patterns].join(' ').toLowerCase() }] : [];
  });
}
export function rankQuestions<T extends { id: string; tags: string[]; language?: string }>(bank: T[], contexts: MatchContext[], limit: number) {
  return bank.flatMap(item => {
    const matches = contexts.filter(c => languageMatches(item.language, c.language)).map(context => ({ context, score: item.tags.reduce((n, tag) => n + (new RegExp(`\\b${tag}\\w*`, 'i').test(context.text) ? 1 : 0), 0) }));
    const best = matches.sort((a, b) => b.score - a.score)[0];
    return best && (best.score > 0 || item.language) ? [{ item, evidence: { path: best.context.path, line: best.context.line }, score: best.score + (item.language ? 2 : 0) }] : [];
  }).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id)).slice(0, limit);
}

export function curatedInterview(item: BankInterview, evidence: { path: string; line: number }, connection: string): Analysis['interviews'][number] {
  return { origin: 'curated', bankId: item.id, question: item.question, category: 'Technical', answer: item.answer, beginnerAnswer: item.answer,
    staffAnswer: `${item.answer} Trade-off: ${item.tradeoff} Validate the relevant boundary and failure cases in the referenced code.`, tradeoff: item.tradeoff, evidence, connection,
    star: { situation: 'Choose a real situation from your own work related to this question.', task: 'Explain the requirement and your actual responsibility.', action: 'Describe what you personally changed and why; distinguish proposals from completed work.', result: 'State only outcomes you observed or measured. Explain what remains unverified.' } };
}

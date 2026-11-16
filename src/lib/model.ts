import { z } from 'zod';
import { explorationSchema, sourceExcerptSchema } from './exploration';

// This schema is shared by the LLM boundary, database reads, and the dashboard.
const evidence = z.object({ path: z.string(), line: z.number().int().min(1) });
const implementation = z.object({ starter: z.string(), solution: z.string() });
const provenance = { origin: z.enum(['curated', 'generated']).optional(), bankId: z.string().optional(), connection: z.string().optional() };
export const practiceTopics = ['Design', 'Frontend', 'Backend', 'Database', 'Testing', 'Debugging', 'Algorithms'] as const;
export const practiceTopicSchema = z.enum(practiceTopics);
export type PracticeTopic = typeof practiceTopics[number];
const topicList = z.array(practiceTopicSchema).min(1).max(7);
export const runnerSchema = z.object({
  entry: z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),
  preserveInput: z.boolean(),
  cases: z.array(z.object({ name: z.string(), args: z.string(), expected: z.string(), matcher: z.enum(['exact', 'topological']) })).min(1).max(20),
});
export const sourceSelectionSchema = z.object({
  evidence, endLine: z.number().int().min(1), whySelected: z.string(),
  similarities: z.array(z.object({ sourceLine: z.number().int().min(1), practiceLine: z.number().int().min(1), explanation: z.string() })).min(1).max(6),
  differences: z.string(),
});
export const sourceContextSchema = sourceSelectionSchema.extend({ code: z.string(), language: z.string() });
export const exerciseSchema = z.object({
  origin: provenance.origin, bankId: provenance.bankId,
  sourceContext: sourceContextSchema.optional(),
  topics: topicList.optional(),
  id: z.string(), title: z.string(), difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  pattern: z.string(), connection: z.string(), evidence, statement: z.string(),
  constraints: z.array(z.string()), edgeCases: z.array(z.string()),
  tests: z.array(z.object({ input: z.string(), expected: z.string(), explanation: z.string() })),
  explanation: z.string(), complexity: z.string(),
  languages: z.object({ Python: implementation.optional(), TypeScript: implementation, Java: implementation.optional(), 'C++': implementation.optional() }),
  runner: runnerSchema.optional(),
  alternatives: z.array(z.object({ title: z.string(), explanation: z.string(), code: z.string() })).optional(),
});
export const debugChallengeSchema = z.object({
  sourceContext: sourceContextSchema.optional(),
  topics: topicList.optional(),
  id: z.string(), title: z.string(), kind: z.enum(['Find the bug', 'Trace the symptom', 'What if']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']), evidence,
  scenario: z.string(), symptom: z.string(), task: z.string(),
  candidates: z.array(z.string()).min(2).max(8), hints: z.array(z.string()),
  buggyCode: z.string(), solution: z.string(), diagnosis: z.string(),
  alternatives: z.array(z.object({ title: z.string(), explanation: z.string(), code: z.string() })).min(1),
  runner: runnerSchema,
});
export const recallSelectionSchema = z.object({
  topics: topicList.optional(),
  id: z.string(), title: z.string(), kind: z.enum(['Core logic', 'Supporting code']),
  evidence, endLine: z.number().int().min(1),
  whatItDoes: z.string(), whyNeeded: z.string(), steps: z.array(z.string()).min(1).max(8),
});
export const recallExerciseSchema = recallSelectionSchema.extend({ language: z.string(), code: z.string() });
export const interviewSchema = z.object({ ...provenance, question: z.string(), category: z.enum(['System design', 'Technical', 'Behavioral']),
  simpleQuestion: z.string().min(1).optional(), engineeringQuestion: z.string().min(1).optional(),
  answer: z.string(), beginnerAnswer: z.string().optional(), staffAnswer: z.string().optional(), tradeoff: z.string(), star: z.object({ situation: z.string(), task: z.string(), action: z.string(), result: z.string() }), evidence });
export const resumeBulletSchema = z.object({
  id: z.string(), category: z.enum(['Architecture', 'Frontend', 'Backend', 'Database', 'Testing', 'Performance', 'Security']),
  text: z.string(), technologies: z.array(z.string()), evidence,
});
export const analysisSchema = z.object({
  exploration: explorationSchema.optional(),
  sourceExcerpts: z.array(sourceExcerptSchema).max(24).optional(),
  schemaVersion: z.literal(1), title: z.string(), summary: z.string(), purpose: z.string(),
  architecture: z.object({
    components: z.array(z.object({ name: z.string(), role: z.string(), paths: z.array(z.string()) })),
    workflow: z.array(z.object({ title: z.string(), description: z.string() })),
    decisions: z.array(z.object({ title: z.string(), explanation: z.string(), tradeoff: z.string(), evidence })),
  }),
  concepts: z.array(z.object({ title: z.string(), explanation: z.string(), evidence,
    complexity: z.string(), memory: z.string(), caching: z.string(), concurrency: z.string(), testing: z.string() })),
  exercises: z.array(exerciseSchema),
  debugChallenges: z.array(debugChallengeSchema).optional(),
  recallExercises: z.array(recallExerciseSchema).optional(),
  interviews: z.array(interviewSchema),
  resumeBullets: z.array(resumeBulletSchema).optional(),
  roadmap: z.array(z.object({ title: z.string(), severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    category: z.enum(['Security', 'Performance', 'Maintainability', 'Testing']),
    finding: z.string(), evidence, steps: z.array(z.string()), validation: z.string(), effort: z.string() })),
  limitations: z.array(z.string()),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Runner = z.infer<typeof runnerSchema>;
export type DebugChallenge = z.infer<typeof debugChallengeSchema>;
export type RecallExercise = z.infer<typeof recallExerciseSchema>;
export type RecallSelection = z.infer<typeof recallSelectionSchema>;
export type SourceSelection = z.infer<typeof sourceSelectionSchema>;
export type SourceContext = z.infer<typeof sourceContextSchema>;
export type ResumeBullet = z.infer<typeof resumeBulletSchema>;
export type LanguageName = keyof Exercise['languages'];
export type FileMetric = { path: string; language: string; loc: number; lines: number; bytes: number; parser: string; parseErrors: boolean; symbols: string[]; imports: string[]; patterns: string[] };
export type LanguageStat = { name: string; loc: number; percent: number };
export type Project = { id: string; name: string; status: string; created_at: string; error: string | null; files: FileMetric[]; languages: LanguageStat[]; total_loc: number };

import { getQuickJS } from 'quickjs-emscripten';
import ts from 'typescript';
import { isDeepStrictEqual } from 'node:util';
import type { Runner } from '../lib/model';
import type { CheckResult } from '../lib/practice-result';

function matches(actual: unknown, expected: unknown, args: unknown[], matcher: string) {
  if (matcher === 'exact') return isDeepStrictEqual(actual, expected);
  const [n, edges] = args as [number, number[][]];
  if (!Array.isArray(actual) || !Number.isInteger(n) || !Array.isArray(edges)) return false;
  if (Array.isArray(expected) && expected.length === 0 && n > 0) return actual.length === 0;
  if (actual.length !== n || new Set(actual).size !== n || actual.some(x => !Number.isInteger(x) || x < 0 || x >= n)) return false;
  const positions = new Map(actual.map((value, index) => [value, index]));
  return edges.every(([a, b]) => positions.get(a)! < positions.get(b)!);
}
export async function runPractice(source: string, spec: Runner, budgetMs = 1200): Promise<CheckResult> {
  if (source.length > 20000 || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(spec.entry)) throw new Error('Invalid submission.');
  const compiled = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None, strict: true } });
  const syntax = compiled.diagnostics?.find(d => d.category === ts.DiagnosticCategory.Error);
  if (syntax) return { verdict: 'incorrect', passed: 0, total: spec.cases.length, cases: [{ name: 'Compilation', passed: false, expected: 'Valid TypeScript', actual: '', error: ts.flattenDiagnosticMessageText(syntax.messageText, '\n') }] };
  const engine = await getQuickJS();
  const deadline = Date.now() + budgetMs;
  const cases: CheckResult['cases'] = [];
  for (const test of spec.cases) {
    const runtime = engine.newRuntime();
    runtime.setMemoryLimit(16 * 1024 * 1024); runtime.setMaxStackSize(256 * 1024);
    runtime.setInterruptHandler(() => Date.now() >= deadline);
    const vm = runtime.newContext();
    try {
      const args: unknown[] = JSON.parse(test.args), expected = JSON.parse(test.expected);
      if (!Array.isArray(args)) throw new Error('Invalid test arguments.');
      // Evaluate source separately from the trusted harness. No host functions or module loader are exposed.
      const loaded = vm.evalCode(compiled.outputText, 'answer.js');
      if (loaded.error) { const error = vm.dump(loaded.error); loaded.error.dispose(); throw new Error(String(error.message ?? error)); }
      loaded.value.dispose();
      const fn = vm.evalCode(spec.entry);
      if (fn.error) { fn.error.dispose(); throw new Error(`Define a function named ${spec.entry}.`); }
      const handles = args.map(arg => vm.unwrapResult(vm.evalCode(`(${JSON.stringify(arg)})`)));
      try {
        const result = vm.callFunction(fn.value, vm.undefined, ...handles);
        if (result.error) { const error = vm.dump(result.error); result.error.dispose(); throw new Error(String(error.message ?? error)); }
        try {
          const actual: unknown = vm.dump(result.value);
          const after = handles.map(h => vm.dump(h));
          const unchanged = !spec.preserveInput || isDeepStrictEqual(args, after);
          const passed = unchanged && matches(actual, expected, args, test.matcher);
          // Limit diagnostics returned to the browser, including hostile return values.
          const display = JSON.stringify(actual) ?? String(actual);
          cases.push({ name: test.name, passed, expected: test.expected, actual: display.slice(0, 2000), ...(!unchanged ? { error: 'The function changed its input.' } : {}) });
        } finally { result.value.dispose(); }
      } finally { fn.value.dispose(); handles.forEach(h => h.dispose()); }
    } catch (error) {
      cases.push({ name: test.name, passed: false, expected: test.expected, actual: '', error: Date.now() >= deadline ? 'Time limit exceeded. Check for an infinite loop.' : String((error as Error).message).slice(0, 400) });
    } finally { vm.dispose(); runtime.dispose(); }
    if (Date.now() >= deadline) break;
  }
  const passed = cases.filter(c => c.passed).length;
  return { verdict: passed === spec.cases.length ? 'correct' : 'incorrect', passed, total: spec.cases.length, cases };
}

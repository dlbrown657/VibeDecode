import { execFileSync } from 'node:child_process';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const limit = 1024 * 1024;

async function capture() {
  const [repository, base, target, ...extra] = process.argv.slice(2);
  if (!repository || (target && !base) || extra.length) {
    throw new Error('Usage: npm run compare -- <repository-folder> [base-ref [target-ref]]');
  }
  const folder = resolve(repository);
  function git(args: string[], overrides: string[] = []) {
    return execFileSync('git', ['-C', folder, '-c', 'core.fsmonitor=false', ...overrides, ...args], {
      encoding: 'utf8',
      maxBuffer: limit,
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  if (git(['rev-parse', '--is-inside-work-tree']).trim() !== 'true') {
    throw new Error('Choose a folder inside a Git working tree.');
  }

  // Git can execute configured clean filters while comparing working-tree files.
  const configNames = git(['config', '--null', '--name-only', '--list']).split('\0');
  const filters = new Set(configNames.map(name => /^filter\.(.+)\.(?:clean|process|required)$/i.exec(name)?.[1]).filter(Boolean));
  const noFilters = [...filters].flatMap(name => ['-c', `filter.${name}.clean=`, '-c', `filter.${name}.process=`, '-c', `filter.${name}.required=false`]);
  function commit(ref: string) {
    const sha = git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
    if (!/^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(sha)) throw new Error('Invalid Git commit.');
    return sha;
  }

  const from = commit(base ?? 'HEAD');
  const to = target ? commit(target) : null;
  const revisions = to ? [from, to] : [from];
  const options = ['--no-ext-diff', '--no-textconv', '--no-color', '--ignore-submodules=all'];
  const patch = git(['diff', ...options, '--patch', ...revisions, '--'], noFilters);
  const summary = git(['diff', ...options, '--stat', ...revisions, '--'], noFilters);
  const untracked = to ? [] : git(['ls-files', '--others', '--exclude-standard', '-z', '--'])
    .split('\0').filter(Boolean).slice(0, 100);
  const snapshot = JSON.stringify({
    name: basename(git(['rev-parse', '--show-toplevel']).trim()),
    base: from,
    target: to,
    summary,
    patch,
    untracked,
  });
  if (Buffer.byteLength(snapshot) > limit) throw new Error('Comparison exceeds 1 MiB. Choose a smaller range.');
  await mkdir('output/previews', { recursive: true });
  const temporary = `output/previews/compare-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, snapshot, { flag: 'wx' });
    await rename(temporary, 'output/previews/comparison.json');
  } finally {
    await rm(temporary, { force: true });
  }
  console.log('Comparison saved. Run npm run dev and open http://127.0.0.1:3000/compare.');
}

try {
  await capture();
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOBUFS') {
    console.error('Comparison exceeds 1 MiB. Choose a smaller range.');
  } else if (error && typeof error === 'object' && 'stderr' in error) {
    console.error('Git could not read the repository or resolve the requested refs.');
  } else {
    console.error(error instanceof Error ? error.message : 'Could not capture comparison.');
  }
  process.exitCode = 1;
}

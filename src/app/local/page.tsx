import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { localReportsEnabled, readLocalReport } from '@/server/local-report';

export const metadata = { title: 'Local analysis', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LocalAnalysisPage() {
  if (!localReportsEnabled()) notFound();
  const preview = await readLocalReport().catch(() => null);
  if (preview) return <Workspace preview={preview} showLocalReport />;
  return (
    <main className="legal-page">
      <h1>Open a local analysis</h1>
      <p>Ask your coding assistant to create a VibeDecode report using the Local AI instructions in the README.</p>
      <p>Save a valid report to <code>output/previews/local-report.json</code>, then refresh this page.</p>
      <a href="/demo">Explore the sample workspace</a>
      <p><a href="/compare">Compare changes in a local Git repository</a></p>
    </main>
  );
}

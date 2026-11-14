import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { readChicagoPreview } from '@/server/chicago-preview';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chicago mobile local preview', robots: { index: false, follow: false } };
export default async function ChicagoPreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const preview = await readChicagoPreview().catch(() => null);
  if (!preview) notFound();
  return <Workspace preview={preview} />;
}


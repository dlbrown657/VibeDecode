import { redirect } from 'next/navigation';
import { localReportsEnabled } from '@/server/local-report';

export default function Home() {
  redirect(localReportsEnabled() ? '/local' : '/demo');
}

import { pageMetadata } from '@/lib/site';
import { Workspace } from '@/components/workspace';
import { localReportsEnabled } from '@/server/local-report';
export const metadata = pageMetadata("Practice demo", "Explore a sample project with architecture explanations, coding challenges, debugging and interview practice.", '/demo', false);
export default function Demo() { return <Workspace showLocalReport={localReportsEnabled()} />; }


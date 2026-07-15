import { PortalCrudPage } from '@/components/PortalCrudPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <PortalCrudPage resourceKey="projects" />;
}

import { PortalAdminListPage } from '@/lib/portal/admin-pages';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <PortalAdminListPage kind="clients" />;
}

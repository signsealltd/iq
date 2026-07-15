import { PageHeader } from "@/components/PageHeader";
import { PortalWizard } from "@/components/PortalWizard";
import { requireInternalPortalUser } from "@/lib/portal/authz";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireInternalPortalUser();
  return <div className="grid gap-4"><PageHeader title="Create Client Portal" description="Guided setup for a client, programme, first project/site and optional invitation." /><PortalWizard /></div>;
}

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PortalCrudTable } from "@/components/PortalCrudTable";
import { portalResources } from "@/lib/portal/crud-config";
import { portalPayload } from "@/lib/portal/crud-server";
import { requireInternalPortalUser } from "@/lib/portal/authz";

export async function PortalCrudPage({ resourceKey }: { resourceKey: string }) {
  await requireInternalPortalUser();
  const resource = portalResources[resourceKey];
  if (!resource) notFound();
  const payload = await portalPayload(resourceKey);
  return <div className="grid gap-4"><PageHeader title={resource.title} description={resource.description} /><PortalCrudTable resource={resource} initialRows={payload.rows} lookups={payload.lookups} /></div>;
}

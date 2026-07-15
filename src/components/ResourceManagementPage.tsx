import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ManagementTable } from "@/components/ManagementTable";
import { managementResources } from "@/lib/management/config";
import { resourcePayload } from "@/lib/management/server";

export async function ResourceManagementPage({ resourceKey }: { resourceKey: string }) {
  const resource = managementResources[resourceKey];
  if (!resource) notFound();
  const payload = await resourcePayload(resourceKey);
  return (
    <>
      <PageHeader title={resource.title} description={resource.description} />
      <ManagementTable resource={resource} initialRows={payload.rows} lookups={payload.lookups} />
    </>
  );
}
import { ResourceManagementPage } from "@/components/ResourceManagementPage";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return <ResourceManagementPage resourceKey="customers" />;
}
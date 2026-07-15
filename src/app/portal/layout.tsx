import { redirect } from "next/navigation";
import { requirePortalUser } from "@/lib/portal/authz";
import { PortalShell } from "@/components/PortalShell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser();
  if (user.role !== "CLIENT" && user.role === "READ_ONLY") redirect("/forbidden");
  return <PortalShell user={{ name: user.name, role: user.role }}>{children}</PortalShell>;
}

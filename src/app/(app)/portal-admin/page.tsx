import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireInternalPortalUser } from "@/lib/portal/authz";
import { formatPortalStatus } from "@/lib/portal/stages";

export const dynamic = "force-dynamic";

const links = [
  ["/portal-admin/clients", "Clients", "Portal-enabled organisations and billing contacts"],
  ["/portal-admin/programmes", "Programmes", "Multi-site client programmes and progress"],
  ["/portal-admin/projects", "Projects", "Project records inside programmes"],
  ["/portal-admin/sites", "Sites", "Site-level statuses, files, approvals, messages and timelines"],
  ["/portal-admin/users", "Client users", "Contacts with portal access"],
  ["/portal-admin/action-requests", "Action requests", "Client tasks awaiting completion"],
  ["/portal-admin/activity", "Portal activity", "Audit trail, messages and notifications"],
  ["/portal-admin/email-templates", "Email templates", "Configurable portal notification wording"]
] as const;

export default async function PortalAdminPage() {
  await requireInternalPortalUser();
  const [clients, programmes, projects, actions] = await Promise.all([
    prisma.customer.count({ where: { portalEnabled: true } }),
    prisma.clientProgramme.count(),
    prisma.clientProject.count(),
    prisma.clientActionRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "OVERDUE"] } } })
  ]);
  const recent = await prisma.clientProject.findMany({ include: { programme: { include: { customer: true } } }, orderBy: { updatedAt: "desc" }, take: 6 });
  return (
    <div className="grid gap-4">
      <PageHeader title="Clients & Portal" description="Create and manage secure client-facing programme portals without exposing internal pricing or margin data." />
      <section className="grid gap-3 md:grid-cols-4"><Metric label="Portal clients" value={clients} href="/portal-admin/clients" /><Metric label="Programmes" value={programmes} href="/portal-admin/programmes" /><Metric label="Projects" value={projects} href="/portal-admin/projects" /><Metric label="Open actions" value={actions} href="/portal-admin/action-requests" /></section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{links.map(([href, title, description]) => <Link key={href} href={href as never} className="panel p-4 hover:border-accent"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-steel">{description}</p></Link>)}</section>
      <section className="panel p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold">Create client portal wizard</h2><p className="mt-1 text-sm text-steel">Create a client, programme, first project/site and invitation in one guided flow.</p></div><Link href={"/portal-admin/wizard" as never} className="button">Open wizard</Link></div></section>
      <section className="panel p-4"><h2 className="font-semibold">Recently updated projects</h2><div className="mt-3 grid gap-2">{recent.map((project) => <Link key={project.id} href={`/portal/projects/${project.id}` as never} className="rounded-md border border-line bg-elevated p-3"><p className="font-semibold">{project.name}</p><p className="text-sm text-steel">{project.programme.customer.company} - {formatPortalStatus(project.status)}</p></Link>)}</div></section>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: number; href: string }) { return <Link href={href as never} className="panel p-4 hover:border-accent"><p className="text-2xl font-bold">{value}</p><p className="text-sm text-steel">{label}</p></Link>; }




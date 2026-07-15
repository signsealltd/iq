import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireInternalPortalUser } from "@/lib/portal/authz";
import { formatPortalStatus } from "@/lib/portal/stages";

export async function PortalAdminListPage({ kind }: { kind: "clients" | "programmes" | "projects" | "users" | "action-requests" | "activity" | "email-templates" }) {
  await requireInternalPortalUser();
  if (kind === "clients") {
    const rows = await prisma.customer.findMany({ where: { portalEnabled: true }, include: { programmes: true, portalUsers: true }, orderBy: { company: "asc" } });
    return <List title="Portal clients" description="Organisations with portal access enabled." rows={rows.map((row) => ({ title: row.company, meta: `${row.programmes.length} programmes - ${row.portalUsers.length} users`, href: "/customers" }))} />;
  }
  if (kind === "programmes") {
    const rows = await prisma.clientProgramme.findMany({ include: { customer: true, projects: true }, orderBy: { updatedAt: "desc" } });
    return <List title="Programmes" description="Client programmes grouping related site projects." rows={rows.map((row) => ({ title: row.name, meta: `${row.customer.company} - ${formatPortalStatus(row.status)} - ${row.projects.length} projects`, href: `/portal/programmes/${row.id}` }))} />;
  }
  if (kind === "projects") {
    const rows = await prisma.clientProject.findMany({ include: { programme: { include: { customer: true } }, actionRequests: true }, orderBy: { updatedAt: "desc" } });
    return <List title="Projects" description="Site-level portal projects and workflow state." rows={rows.map((row) => ({ title: row.name, meta: `${row.programme.customer.company} - ${formatPortalStatus(row.status)} - ${row.actionRequests.length} requests`, href: `/portal/projects/${row.id}` }))} />;
  }
  if (kind === "users") {
    const rows = await prisma.user.findMany({ where: { role: "CLIENT" }, include: { customer: true }, orderBy: { name: "asc" } });
    return <List title="Client users" description="Client contacts with authenticated portal access." rows={rows.map((row) => ({ title: row.name, meta: `${row.email} - ${row.customer?.company ?? "No client linked"}`, href: "/portal-admin/users" }))} />;
  }
  if (kind === "action-requests") {
    const rows = await prisma.clientActionRequest.findMany({ include: { project: { include: { programme: { include: { customer: true } } } }, assignedUser: true }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] });
    return <List title="Action requests" description="Tasks assigned to client contacts." rows={rows.map((row) => ({ title: row.title, meta: `${row.project.programme.customer.company} - ${row.project.name} - ${formatPortalStatus(row.status)}`, href: `/portal/projects/${row.projectId}` }))} />;
  }
  if (kind === "activity") {
    const rows = await prisma.portalNotification.findMany({ include: { customer: true, project: true, user: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return <List title="Portal activity" description="Queued/sent notification activity and related project events." rows={rows.map((row) => ({ title: formatPortalStatus(row.event), meta: `${formatPortalStatus(row.status)} - ${row.customer?.company ?? row.user?.name ?? "System"} - ${row.createdAt.toLocaleString("en-GB")}`, href: row.projectId ? `/portal/projects/${row.projectId}` : "/portal-admin/activity" }))} />;
  }
  const rows = await prisma.emailTemplate.findMany({ orderBy: { event: "asc" } });
  return <List title="Email templates" description="Configurable wording used by portal notifications." rows={rows.map((row) => ({ title: formatPortalStatus(row.event), meta: `${row.active ? "Active" : "Inactive"} - ${row.subject}`, href: "/portal-admin/email-templates" }))} />;
}

function List({ title, description, rows }: { title: string; description: string; rows: { title: string; meta: string; href: string }[] }) {
  return <div className="grid gap-4"><PageHeader title={title} description={description} /><div className="panel p-3"><div className="grid gap-2">{rows.map((row, index) => <Link key={`${row.href}-${index}`} href={row.href as never} className="rounded-md border border-line bg-elevated p-3 hover:border-accent"><p className="font-semibold">{row.title}</p><p className="text-sm text-steel">{row.meta}</p></Link>)}{!rows.length ? <p className="p-3 text-sm text-steel">No records yet.</p> : null}</div></div></div>;
}

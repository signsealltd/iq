import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal/authz";
import { canAccessCustomer } from "@/lib/portal/security";
import { formatPortalStatus, progressFromStages } from "@/lib/portal/stages";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const user = await requirePortalUser();
  const programmes = await prisma.clientProgramme.findMany({
    where: user.role === "CLIENT" ? { customerId: user.customerId ?? "__none__" } : {},
    include: {
      customer: true,
      projects: { include: { stages: true, documents: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { createdAt: "desc" }, take: 2 }, actionRequests: true, messages: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { createdAt: "desc" }, take: 2 } } }
    },
    orderBy: { updatedAt: "desc" }
  });
  const visibleProgrammes = programmes.filter((programme) => canAccessCustomer(user, programme.customerId));
  const projects = visibleProgrammes.flatMap((programme) => programme.projects.map((project) => ({ ...project, programme })));
  const openActions = projects.flatMap((project) => project.actionRequests.filter((request) => ["OPEN", "IN_PROGRESS", "OVERDUE"].includes(request.status)).map((request) => ({ ...request, project })));
  const upcoming = projects.filter((project) => project.surveyDate || project.targetDate).slice(0, 6);
  const recentMessages = projects.flatMap((project) => project.messages.map((message) => ({ ...message, project }))).slice(0, 6);
  const latestDocuments = projects.flatMap((project) => project.documents.map((document) => ({ ...document, project }))).slice(0, 6);
  const statusCounts = projects.reduce<Record<string, number>>((counts, project) => ({ ...counts, [project.status]: (counts[project.status] ?? 0) + 1 }), {});

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client portal</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Welcome, {user.name}</h1>
          <p className="mt-2 max-w-3xl text-steel">Track signage programmes, respond to requests, review artwork and keep project communication in one secure place.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <Metric label="Programmes" value={visibleProgrammes.length} />
          <Metric label="Projects" value={projects.length} />
          <Metric label="Awaiting you" value={openActions.length} />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Panel title="Active programmes" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-2">
            {visibleProgrammes.map((programme) => {
              const progress = programme.projects.length ? Math.round(programme.projects.reduce((sum, project) => sum + progressFromStages(project.stages), 0) / programme.projects.length) : 0;
              return <Link key={programme.id} href={`/portal/programmes/${programme.id}` as never} className="rounded-md border border-line bg-elevated p-3 hover:border-accent"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{programme.name}</p><p className="text-sm text-steel">{programme.customer.company}</p></div><span className="text-xs text-steel">{formatPortalStatus(programme.status)}</span></div><div className="mt-3 h-2 rounded-full bg-panel"><div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-steel">{progress}% overall progress</p></Link>;
            })}
            {!visibleProgrammes.length ? <p className="text-sm text-steel">No active programmes are available yet.</p> : null}
          </div>
        </Panel>
        <Panel title="Projects by status">
          <div className="grid gap-2 text-sm">
            {Object.entries(statusCounts).map(([status, count]) => <div key={status} className="flex justify-between"><span>{formatPortalStatus(status)}</span><strong>{count}</strong></div>)}
            {!Object.keys(statusCounts).length ? <p className="text-steel">No projects yet.</p> : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Panel title="Items awaiting client action">
          <List items={openActions.map((request) => ({ href: `/portal/projects/${request.project.id}`, title: request.title, meta: request.project.name }))} empty="No outstanding action requests." />
        </Panel>
        <Panel title="Recent updates">
          <List items={recentMessages.map((message) => ({ href: `/portal/projects/${message.project.id}`, title: message.body.slice(0, 80), meta: `${message.senderName} - ${message.project.name}` }))} empty="No recent updates." />
        </Panel>
        <Panel title="Upcoming surveys/installations">
          <List items={upcoming.map((project) => ({ href: `/portal/projects/${project.id}`, title: project.name, meta: project.surveyDate ? `Survey ${project.surveyDate.toLocaleDateString("en-GB")}` : `Target ${project.targetDate?.toLocaleDateString("en-GB")}` }))} empty="No upcoming dated work." />
        </Panel>
      </section>

      <Panel title="Latest uploaded documents">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {latestDocuments.map((document) => <Link key={document.id} href={`/portal/projects/${document.project.id}` as never} className="rounded-md border border-line bg-elevated p-3"><p className="font-semibold">{document.filename}</p><p className="text-sm text-steel">{formatPortalStatus(document.type)} - {document.project.name}</p></Link>)}
          {!latestDocuments.length ? <p className="text-sm text-steel">No client-visible documents have been uploaded yet.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-line bg-panel p-3"><p className="text-xl font-bold">{value}</p><p className="text-xs text-steel">{label}</p></div>;
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`panel p-4 ${className}`}><h2 className="mb-3 font-semibold">{title}</h2>{children}</section>;
}

function List({ items, empty }: { items: { href: string; title: string; meta: string }[]; empty: string }) {
  return <div className="grid gap-2 text-sm">{items.map((item, index) => <Link key={`${item.href}-${index}`} href={item.href as never} className="rounded-md border border-line bg-elevated p-3 hover:border-accent"><p className="font-semibold">{item.title}</p><p className="text-steel">{item.meta}</p></Link>)}{!items.length ? <p className="text-steel">{empty}</p> : null}</div>;
}


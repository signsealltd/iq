import Link from "next/link";
import { getAuthorisedProgramme } from "@/lib/portal/authz";
import { formatPortalStatus, progressFromStages } from "@/lib/portal/stages";

export const dynamic = "force-dynamic";

export default async function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { programme } = await getAuthorisedProgramme(id);
  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Programme</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{programme.name}</h1>
        <p className="mt-2 max-w-3xl text-steel">{programme.summary ?? "No programme summary has been added yet."}</p>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <Card label="Client" value={programme.customer.company} />
        <Card label="Status" value={formatPortalStatus(programme.status)} />
        <Card label="Target completion" value={programme.targetCompletionDate?.toLocaleDateString("en-GB") ?? "Not set"} />
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {programme.projects.map((project) => {
          const progress = progressFromStages(project.stages);
          const openActions = project.actionRequests.filter((request) => ["OPEN", "IN_PROGRESS", "OVERDUE"].includes(request.status)).length;
          return <Link key={project.id} href={`/portal/projects/${project.id}` as never} className="panel p-4 hover:border-accent"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{project.name}</h2><p className="text-sm text-steel">{project.siteAddress ?? "Site address pending"}</p></div><span className="text-xs text-steel">{formatPortalStatus(project.status)}</span></div><div className="mt-4 h-2 rounded-full bg-elevated"><div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-steel">{progress}% complete - {openActions} open actions</p></Link>;
        })}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="panel p-4"><p className="text-sm text-steel">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

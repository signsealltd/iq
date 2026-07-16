import { completeActionRequest, deletePortalDocument, deletePortalMessage, postPortalMessage, recordArtworkApproval, updatePortalProjectStatus, updatePortalSiteStatus, uploadPortalDocument } from "@/app/portal/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { getAuthorisedProject } from "@/lib/portal/authz";
import { formatPortalStatus } from "@/lib/portal/stages";
import { isInternalPortalRole } from "@/lib/portal/security";

export const dynamic = "force-dynamic";

const projectStatusOptions = ["INITIAL_ENQUIRY", "SITE_SURVEY", "QUOTATION", "ARTWORK", "CLIENT_APPROVAL", "PRODUCTION", "INSTALLATION_SCHEDULED", "INSTALLED", "COMPLETE", "ON_HOLD"];
const quoteStatusOptions = ["NOT_STARTED", "DRAFT", "SENT", "ACCEPTED", "CHANGES_REQUESTED"];
const artworkStatusOptions = ["NOT_STARTED", "IN_PROGRESS", "PROOF_SENT", "APPROVED", "AMENDMENTS_REQUESTED"];
const productionStatusOptions = ["NOT_STARTED", "READY", "IN_PROGRESS", "COMPLETE"];
const installationStatusOptions = ["NOT_SCHEDULED", "SCHEDULED", "IN_PROGRESS", "INSTALLED", "COMPLETE"];
const documentTypeOptions = ["SITE_SURVEY", "PHOTOGRAPHS", "QUOTATION", "ARTWORK_PROOF", "APPROVAL", "PURCHASE_ORDER", "INVOICE", "INSTALLATION_DOCUMENTATION", "COMPLETION_PHOTOGRAPHS", "OTHER"];

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { user, project } = await getAuthorisedProject(id);
  const isInternal = isInternalPortalRole(user.role);
  const artworkProofs = project.documents.filter((document) => document.type === "ARTWORK_PROOF");
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{project.programme.name}</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{project.name}</h1>
          <p className="mt-2 max-w-3xl text-steel">{project.description ?? "Project details are being prepared."}</p>
          {query.error ? <p className="mt-3 rounded-md border border-amber/40 bg-amber/10 p-3 text-sm text-amber">{query.error}</p> : null}
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <Card label="Project status" value={formatPortalStatus(project.status)} />
          <Card label="Quote" value={formatPortalStatus(project.quoteStatus)} />
          <Card label="Artwork" value={formatPortalStatus(project.artworkStatus)} />
          <Card label="Installation" value={formatPortalStatus(project.installationStatus)} />
        </section>

        {isInternal ? <section className="panel p-4">
          <h2 className="font-semibold">Update project status</h2>
          <form action={updatePortalProjectStatus} className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input type="hidden" name="projectId" value={project.id} />
            <Select label="Project" name="status" value={project.status} options={projectStatusOptions} />
            <Select label="Quote" name="quoteStatus" value={project.quoteStatus} options={quoteStatusOptions} />
            <Select label="Artwork" name="artworkStatus" value={project.artworkStatus} options={artworkStatusOptions} />
            <Select label="Production" name="productionStatus" value={project.productionStatus} options={productionStatusOptions} />
            <Select label="Installation" name="installationStatus" value={project.installationStatus} options={installationStatusOptions} />
            <div className="md:col-span-2 xl:col-span-5"><button className="button">Save project status</button></div>
          </form>
        </section> : null}

        <section className="panel p-4">
          <h2 className="font-semibold">Progress timeline</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {project.stages.filter((stage) => stage.enabled).map((stage) => <div key={stage.id} className="rounded-md border border-line bg-elevated p-3"><p className="font-semibold">{stage.label}</p><p className="text-sm text-steel">{stage.completedAt ? `Completed ${stage.completedAt.toLocaleDateString("en-GB")}` : "In progress / pending"}</p></div>)}
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="font-semibold">Sites</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {project.sites.map((site) => <article key={site.id} className="rounded-md border border-line bg-elevated p-3">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{site.name}</p><p className="text-sm text-steel">{site.address ?? "Address pending"}</p></div><span className="text-xs text-steel">{formatPortalStatus(site.status)}</span></div>
              <div className="mt-3 h-2 rounded-full bg-panel"><div className="h-2 rounded-full bg-accent" style={{ width: `${site.progress}%` }} /></div>
              <p className="mt-2 text-xs text-steel">{site.progress}% progress - {site.documents.length} files - {site.messages.length} messages - {site.artworkApprovals.length} approvals</p>
              <div className="mt-3 grid gap-1 text-xs text-steel">{site.timeline.filter((item) => item.completedAt).slice(0, 3).map((item) => <span key={item.id}>{item.label}: {item.completedAt?.toLocaleDateString("en-GB")}</span>)}</div>
              {isInternal ? <form action={updatePortalSiteStatus} className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="siteId" value={site.id} />
                <Select label="Site status" name="status" value={site.status} options={projectStatusOptions} />
                <label className="grid gap-1"><span>Progress %</span><input name="progress" type="number" min="0" max="100" defaultValue={site.progress} /></label>
                <button className="button-secondary">Update</button>
              </form> : null}
            </article>)}
            {!project.sites.length ? <p className="text-sm text-steel">No sites have been added to this project yet.</p> : null}
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="font-semibold">Messages</h2>
          <div className="mt-3 grid gap-3">
            {project.messages.map((message) => <article key={message.id} className="rounded-md border border-line bg-elevated p-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{message.senderName}</strong><span className="text-steel">{message.createdAt.toLocaleString("en-GB")} - {formatPortalStatus(message.visibility)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-steel">{message.body}</p>{isInternal ? <form action={deletePortalMessage} className="mt-3"><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="messageId" value={message.id} /><ConfirmSubmitButton className="button-secondary min-h-9 px-3 text-danger" message="Delete this portal message permanently?">Delete message</ConfirmSubmitButton></form> : null}</article>)}
            {!project.messages.length ? <p className="text-sm text-steel">No messages yet.</p> : null}
          </div>
          <form action={postPortalMessage} className="mt-4 grid gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <textarea name="body" rows={4} placeholder="Write a project update or reply" required />
            {isInternal ? <select name="visibility" defaultValue="CLIENT_VISIBLE"><option value="CLIENT_VISIBLE">Client-visible</option><option value="INTERNAL_ONLY">Internal-only</option></select> : null}
            <button className="button w-fit">Post message</button>
          </form>
        </section>
      </section>

      <aside className="grid content-start gap-4">
        <section className="panel p-4">
          <h2 className="font-semibold">Client actions</h2>
          <div className="mt-3 grid gap-2">
            {project.actionRequests.map((request) => <form key={request.id} action={completeActionRequest} className="rounded-md border border-line bg-elevated p-3"><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="requestId" value={request.id} /><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{request.title}</p><p className="text-sm text-steel">{request.description ?? "No extra details."}</p><p className="mt-1 text-xs text-steel">{formatPortalStatus(request.status)}{request.dueDate ? ` - due ${request.dueDate.toLocaleDateString("en-GB")}` : ""}</p></div>{request.status !== "COMPLETED" ? <button className="button-secondary">Complete</button> : null}</div></form>)}
            {!project.actionRequests.length ? <p className="text-sm text-steel">No open client actions.</p> : null}
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="font-semibold">Documents</h2>
          <div className="mt-3 grid gap-2">
            {project.documents.map((document) => <div key={document.id} className="rounded-md border border-line bg-elevated p-3"><p className="font-semibold">{document.filename}</p><p className="text-sm text-steel">{formatPortalStatus(document.type)} - v{document.version}</p><p className="text-xs text-steel">{document.description ?? "No description"}</p><div className="mt-2 flex flex-wrap items-center gap-2">{document.storageKey.startsWith("/uploads/portal/") ? <a className="inline-flex text-sm font-semibold text-accent hover:underline" href={`/api/portal/documents/${document.id}/download`} target="_blank" rel="noreferrer">Open document</a> : null}{isInternal ? <form action={deletePortalDocument}><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="documentId" value={document.id} /><ConfirmSubmitButton className="button-secondary min-h-9 px-3 text-danger" message="Remove this portal document permanently?">Remove document</ConfirmSubmitButton></form> : null}</div></div>)}
            {!project.documents.length ? <p className="text-sm text-steel">No client-visible documents yet.</p> : null}
          </div>
          <form action={uploadPortalDocument} className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="grid gap-1"><span>Upload documentation</span><input name="file" type="file" required /></label>
            {project.sites.length ? <label className="grid gap-1"><span>Site</span><select name="siteId" defaultValue=""><option value="">Project level</option>{project.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label> : null}
            <Select label="Document type" name="type" value="OTHER" options={documentTypeOptions} />
            <textarea name="description" rows={3} placeholder="Short description" />
            <p className="text-xs text-steel">PDF, image, Word, Excel and text files up to 15 MB. Uploaded files are visible to the client portal.</p>
            <button className="button">Upload document</button>
          </form>
        </section>

        <section className="panel p-4">
          <h2 className="font-semibold">Artwork approval</h2>
          {artworkProofs.length ? <form action={recordArtworkApproval} className="mt-3 grid gap-2 text-sm"><input type="hidden" name="projectId" value={project.id} /><select name="documentId">{artworkProofs.map((proof) => <option key={proof.id} value={proof.id}>{proof.filename} v{proof.version}</option>)}</select><select name="status" defaultValue="APPROVED"><option value="APPROVED">Approve proof</option><option value="AMENDMENTS_REQUESTED">Request amendments</option></select><label className="flex items-start gap-2 text-ink"><input className="mt-1" type="checkbox" name="checksConfirmed" /> <span>I confirm spelling, contact details, colours, sizing and content have been checked.</span></label><textarea name="comments" rows={3} placeholder="Approval comments or amendment details" /><button className="button">Submit artwork response</button></form> : <p className="mt-2 text-sm text-steel">No artwork proof is awaiting approval.</p>}
          <div className="mt-3 grid gap-2 text-sm">
            {project.artworkApprovals.map((approval) => <div key={approval.id} className="rounded-md border border-line bg-elevated p-3"><p className="font-semibold">{formatPortalStatus(approval.status)} - v{approval.proofVersion}</p><p className="text-steel">{approval.approverName} on {approval.createdAt.toLocaleString("en-GB")}</p>{approval.comments ? <p className="mt-1 text-steel">{approval.comments}</p> : null}</div>)}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="panel p-4"><p className="text-sm text-steel">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Select({ label, name, value, options }: { label: string; name: string; value: string; options: string[] }) {
  return <label className="grid gap-1"><span>{label}</span><select name={name} defaultValue={value}>{options.map((option) => <option key={option} value={option}>{formatPortalStatus(option)}</option>)}</select></label>;
}

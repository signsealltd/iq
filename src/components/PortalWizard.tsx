"use client";

import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useState, useTransition } from "react";

type WizardData = Record<string, string>;
const steps = ["Client", "Programme", "Project", "Site", "Invite"];

export function PortalWizard() {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [data, setData] = useState<WizardData>({ clientName: "", contactName: "", contactEmail: "", contactPhone: "", billingAddress: "", internalNotes: "", programmeName: "", programmeSummary: "", targetCompletionDate: "", projectName: "", projectDescription: "", projectTargetDate: "", siteName: "", siteAddress: "", siteContact: "", siteNotes: "", inviteName: "", inviteEmail: "" });
  const [isPending, startTransition] = useTransition();
  function update(key: string, value: string) { setData((current) => ({ ...current, [key]: value })); }
  function submit() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/portal-admin/wizard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Unable to create portal."); return; }
      setGeneratedLink(typeof result.generatedLink === "string" ? result.generatedLink : "");
      setMessage(result.generatedLink ? "Client portal created. Copy the invite link and send it manually." : "Client portal created.");
    });
  }
  return <section className="panel p-4"><div className="flex flex-wrap gap-2 border-b border-line pb-3">{steps.map((label, index) => <button key={label} className={index === step ? "button" : "button-secondary"} type="button" onClick={() => setStep(index)}>{index + 1}. {label}</button>)}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{step === 0 ? <><Field label="Client name" value={data.clientName} onChange={(v) => update("clientName", v)} required /><Field label="Main contact" value={data.contactName} onChange={(v) => update("contactName", v)} /><Field label="Contact email" value={data.contactEmail} onChange={(v) => update("contactEmail", v)} /><Field label="Telephone" value={data.contactPhone} onChange={(v) => update("contactPhone", v)} /><Area label="Billing details" value={data.billingAddress} onChange={(v) => update("billingAddress", v)} /><Area label="Internal notes" value={data.internalNotes} onChange={(v) => update("internalNotes", v)} /></> : null}{step === 1 ? <><Field label="Programme name" value={data.programmeName} onChange={(v) => update("programmeName", v)} required /><Field label="Target completion" type="date" value={data.targetCompletionDate} onChange={(v) => update("targetCompletionDate", v)} /><Area label="Programme summary" value={data.programmeSummary} onChange={(v) => update("programmeSummary", v)} /></> : null}{step === 2 ? <><Field label="Project name" value={data.projectName} onChange={(v) => update("projectName", v)} required /><Field label="Project target date" type="date" value={data.projectTargetDate} onChange={(v) => update("projectTargetDate", v)} /><Area label="Project description" value={data.projectDescription} onChange={(v) => update("projectDescription", v)} /></> : null}{step === 3 ? <><Field label="Site name" value={data.siteName} onChange={(v) => update("siteName", v)} required /><Field label="Site contact" value={data.siteContact} onChange={(v) => update("siteContact", v)} /><Area label="Site address" value={data.siteAddress} onChange={(v) => update("siteAddress", v)} /><Area label="Client-visible site notes" value={data.siteNotes} onChange={(v) => update("siteNotes", v)} /></> : null}{step === 4 ? <><Field label="Invite name" value={data.inviteName} onChange={(v) => update("inviteName", v)} /><Field label="Invite email" value={data.inviteEmail} onChange={(v) => update("inviteEmail", v)} /><p className="text-sm text-steel md:col-span-2">Submitting generates a secure invite link when an email is provided. It does not expose pricing, margins, supplier costs or internal notes.</p></> : null}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4"><button className="button-secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Back</button><div className="flex items-center gap-2">{generatedLink ? <div className="rounded-md border border-line bg-elevated p-2 text-sm"><p className="font-semibold">Manual invite link</p><p className="break-all text-steel">{generatedLink}</p><button className="button-secondary mt-2" onClick={() => navigator.clipboard.writeText(generatedLink)}><Copy size={16} /> Copy link</button></div> : null}{message ? <p className="text-sm text-amber">{message}</p> : null}{step < steps.length - 1 ? <button className="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>Next <ChevronRight size={16} /></button> : <button className="button" disabled={isPending} onClick={submit}><Check size={16} /> {isPending ? "Creating" : "Create portal"}</button>}</div></div></section>;
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="grid gap-1"><span>{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 md:col-span-2"><span>{label}</span><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }


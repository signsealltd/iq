"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteScheduleEvent, saveScheduleEvent } from "./actions";

type CalendarEvent = {
  id: string;
  title: string;
  status: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  customerId: string | null;
  jobId: string | null;
  customerName: string | null;
  jobReference: string | null;
  location: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  assignedToId: string | null;
  notes: string | null;
  googleCalendarEventId: string | null;
};

type CustomerOption = { id: string; company: string; contactName: string | null; email: string | null; phone: string | null; billingAddress: string | null };
type JobOption = { id: string; label: string; customerId: string };
type UserOption = { id: string; name: string };
type Draft = Omit<CalendarEvent, "id" | "googleCalendarEventId"> & { id?: string };

const statuses = ["PLANNED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const businessTimeZone = "Europe/London";
const statusClasses: Record<string, string> = {
  PLANNED: "border-line bg-elevated",
  CONFIRMED: "border-accent/50 bg-accent/15",
  IN_PROGRESS: "border-warning/50 bg-warning/15",
  COMPLETED: "border-success/50 bg-success/15",
  CANCELLED: "border-danger/50 bg-danger/15"
};

export function WorkCalendarClient({ initialEvents, customers, jobs, users }: { initialEvents: CalendarEvent[]; customers: CustomerOption[]; jobs: JobOption[]; users: UserOption[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const title = visibleMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function openNew(date: Date) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(17, 0, 0, 0);
    setError("");
    setDraft({ title: "", status: "PLANNED", startAt: toDatetimeLocal(start), endAt: toDatetimeLocal(end), allDay: false, customerId: "", jobId: "", customerName: "", jobReference: "", location: "", contactName: "", contactEmail: "", contactPhone: "", assignedToId: "", notes: "" });
  }

  function openExisting(event: CalendarEvent) {
    setError("");
    setDraft({ ...event, startAt: toDatetimeLocal(new Date(event.startAt)), endAt: event.endAt ? toDatetimeLocal(new Date(event.endAt)) : "", customerId: event.customerId ?? "", jobId: event.jobId ?? "", customerName: event.customerName ?? "", jobReference: event.jobReference ?? "", location: event.location ?? "", contactName: event.contactName ?? "", contactEmail: event.contactEmail ?? "", contactPhone: event.contactPhone ?? "", assignedToId: event.assignedToId ?? "", notes: event.notes ?? "" });
  }

  function save() {
    if (!draft) return;
    setError("");
    startTransition(() => {
      saveScheduleEvent(draft)
        .then((saved) => {
          setEvents((current) => [saved as CalendarEvent, ...current.filter((event) => event.id !== saved.id)].sort((a, b) => a.startAt.localeCompare(b.startAt)));
          setDraft(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Unable to save calendar event."));
    });
  }

  function remove() {
    if (!draft?.id || !window.confirm("Remove this scheduled work from the calendar?")) return;
    startTransition(() => {
      deleteScheduleEvent(draft.id!)
        .then((id) => {
          setEvents((current) => current.filter((event) => event.id !== id));
          setDraft(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Unable to remove calendar event."));
    });
  }

  function applyCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);
    setDraft((current) => current ? { ...current, customerId, customerName: customer?.company ?? current.customerName, contactName: customer?.contactName ?? current.contactName, contactEmail: customer?.email ?? current.contactEmail, contactPhone: customer?.phone ?? current.contactPhone, location: current.location || customer?.billingAddress || "" } : current);
  }

  function applyJob(jobId: string) {
    const job = jobs.find((item) => item.id === jobId);
    setDraft((current) => current ? { ...current, jobId, jobReference: job?.label ?? current.jobReference, customerId: job?.customerId ?? current.customerId } : current);
  }

  return (
    <section className="grid gap-4">
      <div className="panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-accent" size={20} />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary px-3" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}><ChevronLeft size={16} /> Previous</button>
          <button className="button-secondary px-3" onClick={() => setVisibleMonth(monthStart(new Date()))}>Today</button>
          <button className="button-secondary px-3" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>Next <ChevronRight size={16} /></button>
          <button className="button" onClick={() => openNew(new Date())}><Plus size={16} /> Schedule work</button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-7 border-b border-line text-xs font-semibold uppercase tracking-wide text-steel md:grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="border-r border-line p-2 last:border-r-0">{day}</div>)}
        </div>
        <div className="grid gap-2 p-2 md:grid-cols-7 md:gap-0 md:p-0">
          {days.map((day) => {
            const dayEvents = events.filter((event) => sameDate(new Date(event.startAt), day.date));
            return <div key={day.key} className={day.inMonth ? "min-h-32 min-w-0 border border-line bg-panel p-2 text-left md:border-l-0 md:border-t-0" : "min-h-32 min-w-0 border border-line bg-elevated/40 p-2 text-left opacity-55 md:border-l-0 md:border-t-0"}>
              <button className={sameDate(day.date, new Date()) ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white" : "text-sm font-semibold"} type="button" onClick={() => openNew(day.date)} aria-label={`Add work on ${day.date.toLocaleDateString("en-GB")}`}>{day.date.getDate()}</button>
              <span className="ml-2 text-xs text-steel md:hidden">{day.date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <div className="mt-2 grid gap-1">
                {dayEvents.slice(0, 4).map((event) => <button key={event.id} type="button" onClick={() => openExisting(event)} className={`min-w-0 rounded-md border px-2 py-1 text-left text-xs ${statusClasses[event.status] ?? statusClasses.PLANNED}`}><strong className="block truncate">{event.title}</strong><span className="block truncate text-steel">{timeLabel(event)}{event.location ? ` - ${event.location}` : ""}</span></button>)}
                {dayEvents.length > 4 ? <span className="text-xs text-steel">+{dayEvents.length - 4} more</span> : null}
              </div>
            </div>;
          })}
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="font-semibold">Upcoming work</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {events.filter((event) => new Date(event.startAt) >= startOfDay(new Date())).slice(0, 9).map((event) => <button key={event.id} className="min-w-0 rounded-md border border-line bg-elevated p-3 text-left hover:border-accent" onClick={() => openExisting(event)}><p className="truncate font-semibold">{event.title}</p><p className="text-sm text-steel">{formatEventDate(event)}</p><p className="truncate text-sm text-steel">{event.customerName ?? "No customer"}{event.location ? ` - ${event.location}` : ""}</p></button>)}
          {!events.length ? <p className="text-sm text-steel">No works scheduled yet. Click a date to add one.</p> : null}
        </div>
      </div>

      {draft ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
        <div className="panel max-h-[94vh] w-full max-w-5xl overflow-y-auto p-4">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-3">
            <div><h2 className="text-lg font-semibold">{draft.id ? "Edit scheduled work" : "Schedule work"}</h2><p className="text-sm text-steel">Google Calendar sync can be connected to these records later.</p></div>
            <button className="button-secondary px-3" type="button" onClick={() => setDraft(null)} aria-label="Close"><X size={16} /></button>
          </div>
          {error ? <p className="mb-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Title" value={draft.title} required onChange={(value) => setDraft({ ...draft, title: value })} />
            <Select label="Status" value={draft.status} options={statuses.map((value) => ({ label: formatStatus(value), value }))} onChange={(value) => setDraft({ ...draft, status: value })} />
            <Select label="Assigned to" value={draft.assignedToId ?? ""} options={users.map((user) => ({ label: user.name, value: user.id }))} onChange={(value) => setDraft({ ...draft, assignedToId: value })} />
            <Field label="Start" type="datetime-local" value={draft.startAt} required onChange={(value) => setDraft({ ...draft, startAt: value })} />
            <Field label="End" type="datetime-local" value={draft.endAt ?? ""} onChange={(value) => setDraft({ ...draft, endAt: value })} />
            <label className="grid gap-1 self-end text-ink"><span>All day</span><select value={String(draft.allDay)} onChange={(event) => setDraft({ ...draft, allDay: event.target.value === "true" })}><option value="false">No</option><option value="true">Yes</option></select></label>
            <Select label="Customer" value={draft.customerId ?? ""} options={customers.map((customer) => ({ label: customer.company, value: customer.id }))} onChange={applyCustomer} />
            <Select label="Job" value={draft.jobId ?? ""} options={jobs.map((job) => ({ label: job.label, value: job.id }))} onChange={applyJob} />
            <Field label="Customer name" value={draft.customerName ?? ""} onChange={(value) => setDraft({ ...draft, customerName: value })} />
            <Field label="Job / work reference" value={draft.jobReference ?? ""} onChange={(value) => setDraft({ ...draft, jobReference: value })} />
            <Field label="Contact name" value={draft.contactName ?? ""} onChange={(value) => setDraft({ ...draft, contactName: value })} />
            <Field label="Contact email" type="email" value={draft.contactEmail ?? ""} onChange={(value) => setDraft({ ...draft, contactEmail: value })} />
            <Field label="Contact phone" value={draft.contactPhone ?? ""} onChange={(value) => setDraft({ ...draft, contactPhone: value })} />
            <Area label="Location" value={draft.location ?? ""} onChange={(value) => setDraft({ ...draft, location: value })} />
            <Area label="Notes" value={draft.notes ?? ""} onChange={(value) => setDraft({ ...draft, notes: value })} />
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-between">
            <div>{draft.id ? <button className="button-secondary text-danger" disabled={isPending} onClick={remove}><Trash2 size={16} /> Remove</button> : null}</div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row"><button className="button-secondary" type="button" onClick={() => setDraft(null)}>Cancel</button><button className="button" disabled={isPending} onClick={save}>{isPending ? "Saving" : "Save schedule"}</button></div>
          </div>
        </div>
      </div> : null}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1"><span>{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 md:col-span-2 xl:col-span-3"><span>{label}</span><textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(month: Date) {
  const start = monthStart(month);
  const offset = (start.getDay() + 6) % 7;
  const first = new Date(start);
  first.setDate(start.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return { date, key: date.toISOString(), inMonth: date.getMonth() === month.getMonth() };
  });
}

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDatetimeLocal(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value.padStart(2, "0") ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

function timeLabel(event: CalendarEvent) {
  if (event.allDay) return "All day";
  return new Date(event.startAt).toLocaleTimeString("en-GB", { timeZone: businessTimeZone, hour: "2-digit", minute: "2-digit" });
}

function formatEventDate(event: CalendarEvent) {
  const options: Intl.DateTimeFormatOptions = event.allDay ? { timeZone: businessTimeZone, dateStyle: "medium" } : { timeZone: businessTimeZone, dateStyle: "medium", timeStyle: "short" };
  return new Date(event.startAt).toLocaleString("en-GB", options);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
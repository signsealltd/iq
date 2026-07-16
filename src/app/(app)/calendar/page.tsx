import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkCalendarClient } from "./WorkCalendarClient";

const internalRoles = ["ADMIN", "DIRECTOR", "ESTIMATOR", "STAFF", "PRODUCTION", "INSTALLER"] as const;

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireRole([...internalRoles]);
  const [events, customers, jobs, users] = await Promise.all([
    prisma.workScheduleEvent.findMany({ where: { archivedAt: null }, orderBy: { startAt: "asc" } }),
    prisma.customer.findMany({ where: { archivedAt: null }, orderBy: { company: "asc" }, select: { id: true, company: true, contactName: true, email: true, phone: true, billingAddress: true } }),
    prisma.job.findMany({ where: { archivedAt: null }, include: { customer: true, quote: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.user.findMany({ where: { active: true, role: { in: [...internalRoles] } }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  return (
    <div>
      <PageHeader title="Works Calendar" description="Schedule where the team will be, when work is happening, and who the client contact is." />
      <WorkCalendarClient
        initialEvents={events.map((event) => ({
          id: event.id,
          title: event.title,
          status: event.status,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt?.toISOString() ?? null,
          allDay: event.allDay,
          customerId: event.customerId,
          jobId: event.jobId,
          customerName: event.customerName,
          jobReference: event.jobReference,
          location: event.location,
          contactName: event.contactName,
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
          assignedToId: event.assignedToId,
          notes: event.notes,
          googleCalendarEventId: event.googleCalendarEventId
        }))}
        customers={customers}
        jobs={jobs.map((job) => ({ id: job.id, label: job.quote?.jobTitle ? `${job.quote.jobTitle} - ${job.customer.company}` : `${job.customer.company} job ${job.id.slice(-6)}`, customerId: job.customerId }))}
        users={users}
      />
    </div>
  );
}
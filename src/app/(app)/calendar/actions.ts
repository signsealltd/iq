"use server";

import { revalidatePath } from "next/cache";
import { audit, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const internalRoles = ["ADMIN", "DIRECTOR", "ESTIMATOR", "STAFF", "PRODUCTION", "INSTALLER"] as const;
const statuses = ["PLANNED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

type ScheduleInput = {
  id?: string;
  title?: string;
  status?: string;
  startAt?: string;
  endAt?: string | null;
  allDay?: boolean;
  customerId?: string | null;
  jobId?: string | null;
  customerName?: string | null;
  jobReference?: string | null;
  location?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
};

export async function saveScheduleEvent(input: ScheduleInput) {
  const user = await requireRole([...internalRoles]);
  const title = input.title?.trim();
  if (!title) throw new Error("Enter a title for the scheduled work.");
  if (!input.startAt) throw new Error("Choose when the work starts.");

  const startAt = new Date(input.startAt);
  if (Number.isNaN(startAt.getTime())) throw new Error("Choose a valid start date and time.");
  const endAt = input.endAt ? new Date(input.endAt) : null;
  if (endAt && Number.isNaN(endAt.getTime())) throw new Error("Choose a valid end date and time.");

  const customerId = cleanId(input.customerId);
  const jobId = cleanId(input.jobId);
  const assignedToId = cleanId(input.assignedToId);
  const status = statuses.includes(input.status as (typeof statuses)[number]) ? input.status as (typeof statuses)[number] : "PLANNED";
  const [customer, job] = await Promise.all([
    customerId ? prisma.customer.findUnique({ where: { id: customerId }, select: { company: true, contactName: true, email: true, phone: true, billingAddress: true } }) : null,
    jobId ? prisma.job.findUnique({ where: { id: jobId }, include: { customer: true, quote: true } }) : null
  ]);

  const linkedCustomerId = customerId ?? job?.customerId ?? null;
  const linkedCustomer = customer ?? job?.customer ?? null;

  const data = {
    title,
    status,
    startAt,
    endAt,
    allDay: Boolean(input.allDay),
    customerId: linkedCustomerId,
    jobId,
    customerName: linkedCustomer?.company ?? text(input.customerName),
    jobReference: job?.quote?.jobTitle ?? text(input.jobReference),
    location: text(input.location) ?? linkedCustomer?.billingAddress ?? null,
    contactName: text(input.contactName) ?? linkedCustomer?.contactName ?? null,
    contactEmail: text(input.contactEmail) ?? linkedCustomer?.email ?? null,
    contactPhone: text(input.contactPhone) ?? linkedCustomer?.phone ?? null,
    assignedToId,
    notes: text(input.notes),
    archivedAt: null
  };

  const event = input.id
    ? await prisma.workScheduleEvent.update({ where: { id: input.id }, data })
    : await prisma.workScheduleEvent.create({ data: { ...data, createdById: user.id } });

  await audit(input.id ? "calendar.event.updated" : "calendar.event.created", "WorkScheduleEvent", event.id, { title: event.title, startAt: event.startAt }, user.id);
  revalidatePath("/calendar");
  return serializeEvent(event);
}

export async function deleteScheduleEvent(id: string) {
  const user = await requireRole([...internalRoles]);
  const event = await prisma.workScheduleEvent.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit("calendar.event.archived", "WorkScheduleEvent", id, { title: event.title }, user.id);
  revalidatePath("/calendar");
  return id;
}

function cleanId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function text(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializeEvent(event: { id: string; title: string; status: string; startAt: Date; endAt: Date | null; allDay: boolean; customerId: string | null; jobId: string | null; customerName: string | null; jobReference: string | null; location: string | null; contactName: string | null; contactEmail: string | null; contactPhone: string | null; assignedToId: string | null; notes: string | null; googleCalendarEventId: string | null }) {
  return {
    ...event,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null
  };
}
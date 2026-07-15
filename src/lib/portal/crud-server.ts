import "server-only";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultProjectStages } from "@/lib/portal/stages";
import { queuePortalNotification } from "@/lib/portal/notifications";

export type PortalCrudRow = Record<string, unknown> & { id: string; archived?: boolean };
export type LookupOption = { label: string; value: string };
export type PortalCrudPayload = { rows: PortalCrudRow[]; lookups: Record<string, LookupOption[]> };

function clean(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== ""));
}
function bool(value: unknown) { return value === true || value === "true" || value === "on"; }
function num(value: unknown, fallback = 0) { return value === "" || value == null ? fallback : Number(value); }
function date(value: unknown) { return value ? new Date(String(value)) : null; }
function dateInput(value: unknown) { return value ? new Date(String(value)).toISOString().slice(0, 10) : null; }
function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

async function lookups() {
  const [clients, programmes, projects, sites, users] = await Promise.all([
    prisma.customer.findMany({ where: { portalEnabled: true }, orderBy: { company: "asc" }, select: { id: true, company: true } }),
    prisma.clientProgramme.findMany({ where: { archivedAt: null }, include: { customer: true }, orderBy: { name: "asc" } }),
    prisma.clientProject.findMany({ where: { archivedAt: null }, include: { programme: { include: { customer: true } } }, orderBy: { name: "asc" } }),
    prisma.clientSite.findMany({ where: { archivedAt: null }, include: { project: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "CLIENT" }, include: { customer: true }, orderBy: { name: "asc" } })
  ]);
  return {
    customerId: clients.map((client) => ({ label: client.company, value: client.id })),
    programmeId: programmes.map((programme) => ({ label: `${programme.customer.company} - ${programme.name}`, value: programme.id })),
    projectId: projects.map((project) => ({ label: `${project.programme.customer.company} - ${project.name}`, value: project.id })),
    siteId: sites.map((site) => ({ label: `${site.project.name} - ${site.name}`, value: site.id })),
    assignedUserId: users.map((user) => ({ label: `${user.customer?.company ?? "Client"} - ${user.name}`, value: user.id }))
  };
}

export async function portalPayload(resource: string): Promise<PortalCrudPayload> {
  const lookupData = await lookups();
  if (resource === "clients") {
    const rows = await prisma.customer.findMany({ where: { portalEnabled: true }, include: { programmes: true, portalUsers: true }, orderBy: { company: "asc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, programmeCount: row.programmes.length, userCount: row.portalUsers.length, archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "programmes") {
    const rows = await prisma.clientProgramme.findMany({ include: { customer: true, projects: true }, orderBy: { updatedAt: "desc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, clientName: row.customer.company, targetCompletionDate: dateInput(row.targetCompletionDate), projectCount: row.projects.length, archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "projects") {
    const rows = await prisma.clientProject.findMany({ include: { programme: { include: { customer: true } }, sites: true }, orderBy: { updatedAt: "desc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, programmeName: row.programme.name, clientName: row.programme.customer.company, surveyDate: dateInput(row.surveyDate), targetDate: dateInput(row.targetDate), siteCount: row.sites.length, archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "sites") {
    const rows = await prisma.clientSite.findMany({ include: { project: { include: { programme: { include: { customer: true } } } }, documents: true, messages: true, artworkApprovals: true }, orderBy: { updatedAt: "desc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, projectName: row.project.name, clientName: row.project.programme.customer.company, fileCount: row.documents.length, messageCount: row.messages.length, approvalCount: row.artworkApprovals.length, archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "users") {
    const rows = await prisma.user.findMany({ where: { role: "CLIENT" }, include: { customer: true }, orderBy: { name: "asc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ id: row.id, customerId: row.customerId, clientName: row.customer?.company, name: row.name, email: row.email, active: row.active, archived: !row.active, createdAt: row.createdAt })) };
  }
  if (resource === "action-requests") {
    const rows = await prisma.clientActionRequest.findMany({ include: { project: true, site: true, assignedUser: true }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, projectName: row.project.name, siteName: row.site?.name, assignedName: row.assignedUser?.name, dueDate: dateInput(row.dueDate), archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "activity") {
    const rows = await prisma.portalNotification.findMany({ include: { customer: true, project: true, user: true }, orderBy: { createdAt: "desc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, clientName: row.customer?.company, projectName: row.project?.name, userName: row.user?.name, archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "email-templates") {
    const rows = await prisma.emailTemplate.findMany({ orderBy: { event: "asc" } });
    return { lookups: lookupData, rows: rows.map((row) => ({ ...row, archived: !row.active })) };
  }
  throw new Error("Unknown portal resource.");
}

export async function createPortalResource(resource: string, body: Record<string, unknown>, userId: string) {
  if (resource === "clients") return prisma.customer.create({ data: clientData(body) as Prisma.CustomerUncheckedCreateInput });
  if (resource === "programmes") return prisma.clientProgramme.create({ data: programmeData(body) as Prisma.ClientProgrammeUncheckedCreateInput });
  if (resource === "projects") {
    const project = await prisma.clientProject.create({ data: projectData(body) as Prisma.ClientProjectUncheckedCreateInput });
    await createDefaultProjectStages(project.id);
    return project;
  }
  if (resource === "sites") {
    const site = await prisma.clientSite.create({ data: siteData(body) as Prisma.ClientSiteUncheckedCreateInput });
    await createDefaultSiteTimeline(site.id);
    return site;
  }
  if (resource === "users") return inviteClientUser(body, userId);
  if (resource === "action-requests") return prisma.clientActionRequest.create({ data: actionData(body, userId) as Prisma.ClientActionRequestUncheckedCreateInput });
  if (resource === "email-templates") return prisma.emailTemplate.create({ data: templateData(body) as Prisma.EmailTemplateUncheckedCreateInput });
  throw new Error("Create is not supported for this resource.");
}

export async function updatePortalResource(resource: string, id: string, body: Record<string, unknown>) {
  if (resource === "clients") return prisma.customer.update({ where: { id }, data: clientData(body) });
  if (resource === "programmes") return prisma.clientProgramme.update({ where: { id }, data: programmeData(body) });
  if (resource === "projects") return prisma.clientProject.update({ where: { id }, data: projectData(body) });
  if (resource === "sites") return prisma.clientSite.update({ where: { id }, data: siteData(body) });
  if (resource === "users") return prisma.user.update({ where: { id }, data: { customerId: body.customerId ? String(body.customerId) : null, name: String(body.name ?? ""), email: String(body.email ?? "").toLowerCase().trim(), active: body.active === undefined ? true : bool(body.active) } });
  if (resource === "action-requests") return prisma.clientActionRequest.update({ where: { id }, data: actionData(body) });
  if (resource === "activity") return prisma.portalNotification.update({ where: { id }, data: clean({ status: body.status, error: body.error }) });
  if (resource === "email-templates") return prisma.emailTemplate.update({ where: { id }, data: templateData(body) });
  throw new Error("Unknown portal resource.");
}

export async function archivePortalResource(resource: string, id: string, archived: boolean) {
  const archivedAt = archived ? new Date() : null;
  if (resource === "clients") return prisma.customer.update({ where: { id }, data: { archivedAt, portalEnabled: !archived } });
  if (resource === "programmes") return prisma.clientProgramme.update({ where: { id }, data: { archivedAt, status: archived ? "ARCHIVED" : "ACTIVE" } });
  if (resource === "projects") return prisma.clientProject.update({ where: { id }, data: { archivedAt } });
  if (resource === "sites") return prisma.clientSite.update({ where: { id }, data: { archivedAt } });
  if (resource === "users") return prisma.user.update({ where: { id }, data: { active: !archived } });
  if (resource === "action-requests") return prisma.clientActionRequest.update({ where: { id }, data: { archivedAt, status: archived ? "CANCELLED" : "OPEN" } });
  if (resource === "activity") return prisma.portalNotification.update({ where: { id }, data: { archivedAt } });
  if (resource === "email-templates") return prisma.emailTemplate.update({ where: { id }, data: { active: !archived } });
  throw new Error("Unknown portal resource.");
}

export async function deletePortalResource(resource: string, id: string) {
  if (resource === "clients") return prisma.customer.delete({ where: { id } });
  if (resource === "programmes") return prisma.clientProgramme.delete({ where: { id } });
  if (resource === "projects") return prisma.clientProject.delete({ where: { id } });
  if (resource === "sites") return prisma.clientSite.delete({ where: { id } });
  if (resource === "users") return prisma.user.delete({ where: { id } });
  if (resource === "action-requests") return prisma.clientActionRequest.delete({ where: { id } });
  if (resource === "activity") return prisma.portalNotification.delete({ where: { id } });
  if (resource === "email-templates") return prisma.emailTemplate.delete({ where: { id } });
  throw new Error("Unknown portal resource.");
}

function clientData(body: Record<string, unknown>) { return clean({ company: body.company, contactName: body.contactName, email: body.email, phone: body.phone, billingAddress: body.billingAddress, notes: body.notes, portalEnabled: body.portalEnabled === undefined ? true : bool(body.portalEnabled) }); }
function programmeData(body: Record<string, unknown>) { return clean({ customerId: body.customerId, name: body.name, summary: body.summary, status: body.status ?? "ACTIVE", targetCompletionDate: date(body.targetCompletionDate) }); }
function projectData(body: Record<string, unknown>) { return clean({ programmeId: body.programmeId, name: body.name, status: body.status ?? "INITIAL_ENQUIRY", description: body.description, surveyDate: date(body.surveyDate), targetDate: date(body.targetDate), quoteStatus: body.quoteStatus ?? "NOT_STARTED", artworkStatus: body.artworkStatus ?? "NOT_STARTED", productionStatus: body.productionStatus ?? "NOT_STARTED", installationStatus: body.installationStatus ?? "NOT_SCHEDULED", notes: body.notes, internalNotes: body.internalNotes }); }
function siteData(body: Record<string, unknown>) { return clean({ projectId: body.projectId, name: body.name, status: body.status ?? "INITIAL_ENQUIRY", progress: Math.max(0, Math.min(100, num(body.progress))), address: body.address, contactName: body.contactName, contactEmail: body.contactEmail, contactPhone: body.contactPhone, notes: body.notes, internalNotes: body.internalNotes }); }
function actionData(body: Record<string, unknown>, createdById?: string) { return clean({ projectId: body.projectId, siteId: body.siteId, assignedUserId: body.assignedUserId, title: body.title, description: body.description, dueDate: date(body.dueDate), status: body.status ?? "OPEN", createdById }); }
function templateData(body: Record<string, unknown>) { return clean({ event: body.event, subject: body.subject, body: body.body, active: body.active === undefined ? true : bool(body.active) }); }

async function inviteClientUser(body: Record<string, unknown>, invitedById: string) {
  const email = String(body.email ?? "").toLowerCase().trim();
  const name = String(body.name ?? email);
  const customerId = String(body.customerId ?? "");
  const token = crypto.randomBytes(32).toString("base64url");
  const placeholderHash = await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, customerId, role: "CLIENT", active: body.active === undefined ? true : bool(body.active) },
    create: { email, name, customerId, role: "CLIENT", active: true, passwordHash: placeholderHash }
  });
  const invitation = await prisma.clientInvitation.create({ data: { customerId, email, name, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), invitedById } });
  await queuePortalNotification({ event: "CLIENT_INVITATION", userId: user.id, customerId, payload: { email, name, invitationId: invitation.id } });
  await audit("portal.client_user.invited", "User", user.id, { customerId, email }, invitedById);
  return user;
}

async function createDefaultProjectStages(projectId: string) {
  await Promise.all(defaultProjectStages.map((label, index) => prisma.projectStage.create({ data: { projectId, label, sortOrder: index + 1 } })));
}
async function createDefaultSiteTimeline(siteId: string) {
  await Promise.all(defaultProjectStages.map((label, index) => prisma.clientSiteTimeline.create({ data: { siteId, label, sortOrder: index + 1 } })));
}

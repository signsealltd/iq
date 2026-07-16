"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateArtworkApproval } from "@/lib/portal/artwork";
import { getAuthorisedProject } from "@/lib/portal/authz";
import { isInternalPortalRole } from "@/lib/portal/security";
import { queuePortalNotification } from "@/lib/portal/notifications";

const portalProjectStatuses = ["INITIAL_ENQUIRY", "SITE_SURVEY", "QUOTATION", "ARTWORK", "CLIENT_APPROVAL", "PRODUCTION", "INSTALLATION_SCHEDULED", "INSTALLED", "COMPLETE", "ON_HOLD"] as const;
const portalQuoteStatuses = ["NOT_STARTED", "DRAFT", "SENT", "ACCEPTED", "CHANGES_REQUESTED"] as const;
const portalArtworkStatuses = ["NOT_STARTED", "IN_PROGRESS", "PROOF_SENT", "APPROVED", "AMENDMENTS_REQUESTED"] as const;
const portalProductionStatuses = ["NOT_STARTED", "READY", "IN_PROGRESS", "COMPLETE"] as const;
const portalInstallationStatuses = ["NOT_SCHEDULED", "SCHEDULED", "IN_PROGRESS", "INSTALLED", "COMPLETE"] as const;
const portalDocumentTypes = ["SITE_SURVEY", "PHOTOGRAPHS", "QUOTATION", "ARTWORK_PROOF", "APPROVAL", "PURCHASE_ORDER", "INVOICE", "INSTALLATION_DOCUMENTATION", "COMPLETION_PHOTOGRAPHS", "OTHER"] as const;
const allowedUploadTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const maxUploadBytes = 15 * 1024 * 1024;

type DocumentType = (typeof portalDocumentTypes)[number];

export async function postPortalMessage(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const requestedVisibility = String(formData.get("visibility") ?? "CLIENT_VISIBLE");
  const { user, project } = await getAuthorisedProject(projectId);
  if (!body) return;
  const visibility = isInternalPortalRole(user.role) && requestedVisibility === "INTERNAL_ONLY" ? "INTERNAL_ONLY" : "CLIENT_VISIBLE";
  await prisma.portalProjectMessage.create({ data: { projectId, senderId: user.id, senderName: user.name, body, visibility } });
  await audit("portal.message.created", "ClientProject", projectId, { visibility }, user.id);
  if (visibility === "CLIENT_VISIBLE") {
    await queuePortalNotification({ event: "CLIENT_VISIBLE_MESSAGE", customerId: project.programme.customerId, projectId, payload: { project: project.name, sender: user.name } });
  }
  revalidatePath(`/portal/projects/${projectId}`);
}

export async function uploadPortalDocument(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const siteId = String(formData.get("siteId") || "") || undefined;
  const requestedType = String(formData.get("type") ?? "OTHER");
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");
  const { user, project } = await getAuthorisedProject(projectId);

  if (!(file instanceof File) || file.size === 0) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Choose a file to upload.")}` as never);
  if (file.size > maxUploadBytes) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Uploads are limited to 15 MB per file.")}` as never);
  if (file.type && !allowedUploadTypes.has(file.type)) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("This file type is not allowed for portal uploads.")}` as never);
  if (siteId && !project.sites.some((site) => site.id === siteId)) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Selected site does not belong to this project.")}` as never);

  const documentType = portalDocumentTypes.includes(requestedType as DocumentType) ? requestedType as DocumentType : "OTHER";
  const safeName = safeFilename(file.name || "portal-document");
  const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const relativeDir = `/uploads/portal/${projectId}`;
  const publicDir = path.join(process.cwd(), "public", "uploads", "portal", projectId);
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, storedName), Buffer.from(await file.arrayBuffer()));

  const latest = await prisma.portalDocument.findFirst({ where: { projectId, siteId: siteId ?? null, filename: safeName }, orderBy: { version: "desc" }, select: { version: true } });
  const document = await prisma.portalDocument.create({
    data: {
      projectId,
      siteId,
      filename: safeName,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageKey: `${relativeDir}/${storedName}`,
      type: documentType,
      visibility: "CLIENT_VISIBLE",
      version: (latest?.version ?? 0) + 1,
      description: description || undefined,
      uploadedById: user.id
    }
  });

  await audit("portal.document.uploaded", "PortalDocument", document.id, { projectId, siteId, filename: safeName, type: documentType }, user.id);
  await queuePortalNotification({ event: "DOCUMENT_UPLOADED", customerId: project.programme.customerId, projectId, payload: { project: project.name, filename: safeName, uploader: user.name } });
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}


export async function deletePortalMessage(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const messageId = String(formData.get("messageId") ?? "");
  const { user, project } = await getAuthorisedProject(projectId);
  if (!isInternalPortalRole(user.role)) redirect("/forbidden");
  if (!project.messages.some((message) => message.id === messageId)) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Message not found on this project.")}` as never);

  await prisma.portalProjectMessage.delete({ where: { id: messageId } });
  await audit("portal.message.deleted", "PortalProjectMessage", messageId, { projectId }, user.id);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function deletePortalDocument(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const { user, project } = await getAuthorisedProject(projectId);
  if (!isInternalPortalRole(user.role)) redirect("/forbidden");
  const document = project.documents.find((item) => item.id === documentId);
  if (!document) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Document not found on this project.")}` as never);

  await prisma.portalDocument.delete({ where: { id: documentId } });
  await deleteStoredPortalUpload(document.storageKey);
  await audit("portal.document.deleted", "PortalDocument", documentId, { projectId, filename: document.filename }, user.id);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}
export async function updatePortalProjectStatus(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const { user } = await getAuthorisedProject(projectId);
  if (!isInternalPortalRole(user.role)) redirect("/forbidden");

  const status = pick(formData, "status", portalProjectStatuses);
  const quoteStatus = pick(formData, "quoteStatus", portalQuoteStatuses);
  const artworkStatus = pick(formData, "artworkStatus", portalArtworkStatuses);
  const productionStatus = pick(formData, "productionStatus", portalProductionStatuses);
  const installationStatus = pick(formData, "installationStatus", portalInstallationStatuses);
  await prisma.clientProject.update({ where: { id: projectId }, data: { status, quoteStatus, artworkStatus, productionStatus, installationStatus } });
  await audit("portal.project.status.updated", "ClientProject", projectId, { status, quoteStatus, artworkStatus, productionStatus, installationStatus }, user.id);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function updatePortalSiteStatus(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const siteId = String(formData.get("siteId") ?? "");
  const { user, project } = await getAuthorisedProject(projectId);
  if (!isInternalPortalRole(user.role)) redirect("/forbidden");
  if (!project.sites.some((site) => site.id === siteId)) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent("Selected site does not belong to this project.")}` as never);

  const status = pick(formData, "status", portalProjectStatuses);
  const progress = Math.max(0, Math.min(100, Number(formData.get("progress") ?? 0)));
  await prisma.clientSite.update({ where: { id: siteId }, data: { status, progress } });
  await audit("portal.site.status.updated", "ClientSite", siteId, { projectId, status, progress }, user.id);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function recordArtworkApproval(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const documentId = String(formData.get("documentId") || "") || undefined;
  const status = String(formData.get("status") ?? "APPROVED") as "APPROVED" | "AMENDMENTS_REQUESTED";
  const comments = String(formData.get("comments") ?? "");
  const checksConfirmed = formData.get("checksConfirmed") === "on";
  const { user, project } = await getAuthorisedProject(projectId);
  const validated = validateArtworkApproval({ status, approverName: user.name, checksConfirmed, comments });
  if (!validated.ok) redirect(`/portal/projects/${projectId}?error=${encodeURIComponent(validated.error)}` as never);
  const proofVersion = documentId ? project.documents.find((document) => document.id === documentId)?.version ?? 1 : 1;
  await prisma.artworkApproval.create({ data: { projectId, documentId, status, proofVersion, approverName: user.name, approverUserId: user.id, comments, checksConfirmed } });
  await prisma.clientProject.update({ where: { id: projectId }, data: { artworkStatus: status === "APPROVED" ? "APPROVED" : "AMENDMENTS_REQUESTED", status: status === "APPROVED" ? "PRODUCTION" : "ARTWORK" } });
  await audit("portal.artwork.approval.recorded", "ClientProject", projectId, { status, proofVersion }, user.id);
  await queuePortalNotification({ event: status === "APPROVED" ? "APPROVAL_REQUESTED" : "AMENDMENT_REQUESTED", customerId: project.programme.customerId, projectId, payload: { project: project.name, status } });
  revalidatePath(`/portal/projects/${projectId}`);
}

export async function completeActionRequest(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const { user } = await getAuthorisedProject(projectId);
  await prisma.clientActionRequest.update({ where: { id: requestId }, data: { status: "COMPLETED", completionDate: new Date() } });
  await audit("portal.action.completed", "ClientActionRequest", requestId, { projectId }, user.id);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");
}


async function deleteStoredPortalUpload(storageKey: string) {
  const filePath = resolvePortalUpload(storageKey);
  if (!filePath) return;
  await unlink(filePath).catch(() => undefined);
}

function resolvePortalUpload(storageKey: string) {
  if (!storageKey.startsWith("/uploads/portal/")) return null;

  const publicRoot = path.resolve(process.cwd(), "public");
  const uploadsRoot = path.resolve(publicRoot, "uploads", "portal");
  const resolved = path.resolve(publicRoot, `.${storageKey}`);
  if (resolved !== uploadsRoot && !resolved.startsWith(`${uploadsRoot}${path.sep}`)) return null;
  return resolved;
}
function pick<T extends readonly string[]>(formData: FormData, key: string, values: T): T[number] {
  const value = String(formData.get(key) ?? "");
  return values.includes(value) ? value : values[0];
}

function safeFilename(input: string) {
  const parsed = path.parse(input.replaceAll("\\", "/"));
  const name = parsed.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "portal-document";
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 16);
  return `${name}${ext}`;
}

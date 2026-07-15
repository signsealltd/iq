"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateArtworkApproval } from "@/lib/portal/artwork";
import { getAuthorisedProject } from "@/lib/portal/authz";
import { isInternalPortalRole } from "@/lib/portal/security";
import { queuePortalNotification } from "@/lib/portal/notifications";

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


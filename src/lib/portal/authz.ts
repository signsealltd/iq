import "server-only";

import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { canAccessCustomer, canAccessProject, canSeeVisibility, isInternalPortalRole } from "@/lib/portal/security";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PortalUser = { id: string; role: Role; customerId?: string | null; active: boolean; name: string; email: string };

export async function requirePortalUser(): Promise<PortalUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "CLIENT" && !user.customerId) redirect("/forbidden");
  return user;
}

export async function requireInternalPortalUser() {
  const user = await requirePortalUser();
  if (!isInternalPortalRole(user.role)) redirect("/forbidden");
  return user;
}

export async function getAuthorisedProgramme(programmeId: string) {
  const user = await requirePortalUser();
  const programme = await prisma.clientProgramme.findUnique({
    where: { id: programmeId },
    include: { customer: true, contacts: { include: { user: true } }, projects: { include: { stages: true, actionRequests: true } } }
  });
  if (!programme || !canAccessCustomer(user, programme.customerId)) notFound();
  return { user, programme };
}

export async function getAuthorisedProject(projectId: string) {
  const user = await requirePortalUser();
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: {
      programme: { include: { customer: true } },
      stages: { orderBy: { sortOrder: "asc" } },
      messages: { orderBy: { createdAt: "desc" }, include: { sender: true } },
      documents: { orderBy: [{ type: "asc" }, { version: "desc" }] },
      artworkApprovals: { orderBy: { createdAt: "desc" } },
      actionRequests: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] }
    }
  });
  if (!project || !canAccessProject(user, project.programme.customerId)) notFound();
  const visibleMessages = project.messages.filter((message) => canSeeVisibility(user, message.visibility));
  const visibleDocuments = project.documents.filter((document) => canSeeVisibility(user, document.visibility));
  return { user, project: { ...project, messages: visibleMessages, documents: visibleDocuments } };
}


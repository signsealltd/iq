import "server-only";

import type { EmailTemplateEvent, PortalNotificationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function queuePortalNotification(input: {
  event: EmailTemplateEvent;
  userId?: string;
  customerId?: string;
  projectId?: string;
  payload?: Prisma.InputJsonValue;
  suppress?: boolean;
}) {
  return prisma.portalNotification.create({
    data: {
      event: input.event,
      userId: input.userId,
      customerId: input.customerId,
      projectId: input.projectId,
      payload: input.payload,
      status: (input.suppress ? "SUPPRESSED" : "QUEUED") as PortalNotificationStatus
    }
  });
}


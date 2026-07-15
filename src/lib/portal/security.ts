import type { Role } from "@prisma/client";

export type PortalActor = { role: Role; customerId?: string | null };

export function isInternalPortalRole(role: Role) {
  return ["ADMIN", "DIRECTOR", "ESTIMATOR", "PRODUCTION", "INSTALLER", "STAFF"].includes(role);
}

export function canAccessCustomer(user: PortalActor, customerId: string) {
  if (isInternalPortalRole(user.role)) return true;
  return user.role === "CLIENT" && user.customerId === customerId;
}

export function canAccessProject(user: PortalActor, projectCustomerId: string) {
  return canAccessCustomer(user, projectCustomerId);
}

export function canSeeVisibility(user: Pick<PortalActor, "role">, visibility: "CLIENT_VISIBLE" | "INTERNAL_ONLY") {
  return visibility === "CLIENT_VISIBLE" || isInternalPortalRole(user.role);
}

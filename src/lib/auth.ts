import "server-only";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "signseal_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<Pick<User, "id" | "email" | "name" | "role" | "active"> | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } }
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/forbidden");
  return user;
}

export async function verifyLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function audit(action: string, entity: string, entityId?: string, metadata?: unknown, userId?: string) {
  const h = await headers();
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      metadata: metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata)),
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined
    }
  });
}

export function can(role: Role, action: "writePricing" | "manageUsers" | "convertQuote" | "viewReports") {
  const matrix: Record<typeof action, Role[]> = {
    writePricing: ["ADMIN", "DIRECTOR", "ESTIMATOR"],
    manageUsers: ["ADMIN"],
    convertQuote: ["ADMIN", "DIRECTOR", "ESTIMATOR"],
    viewReports: ["ADMIN", "DIRECTOR", "ESTIMATOR", "READ_ONLY"]
  };
  return matrix[action].includes(role);
}

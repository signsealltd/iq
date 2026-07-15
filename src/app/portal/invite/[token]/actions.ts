"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { audit, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function acceptPortalInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 10) redirect(`/portal/invite/${token}?error=${encodeURIComponent("Password must be at least 10 characters.")}` as never);
  if (password !== confirmPassword) redirect(`/portal/invite/${token}?error=${encodeURIComponent("Passwords do not match.")}` as never);
  const invitation = await prisma.clientInvitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) redirect(`/portal/invite/${token}?error=${encodeURIComponent("This portal invitation link is invalid or has expired.")}` as never);
  const user = await prisma.user.upsert({
    where: { email: invitation.email.toLowerCase() },
    update: { name: invitation.name ?? invitation.email, customerId: invitation.customerId, role: "CLIENT", active: true, passwordHash: await bcrypt.hash(password, 12) },
    create: { email: invitation.email.toLowerCase(), name: invitation.name ?? invitation.email, customerId: invitation.customerId, role: "CLIENT", active: true, passwordHash: await bcrypt.hash(password, 12) }
  });
  await prisma.clientInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  await audit("portal.invitation.accepted", "ClientInvitation", invitation.id, { customerId: invitation.customerId }, user.id);
  await createSession(user.id);
  redirect("/portal" as never);
}

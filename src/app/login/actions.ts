"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, verifyLogin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`login:${ip}:${email}`, 5, 10 * 60 * 1000);
  if (!limited.ok) return { error: "Too many login attempts. Try again shortly." };
  const user = await verifyLogin(email, password);
  if (!user) return { error: "Invalid email or password." };
  await createSession(user.id);
  redirect("/dashboard");
}

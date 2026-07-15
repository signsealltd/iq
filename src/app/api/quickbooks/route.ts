import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quickBooksStatus } from "@/lib/quickbooks";

export async function GET() {
  await requireUser();
  const settings = Object.fromEntries((await prisma.setting.findMany()).map((setting) => [setting.key, setting.value]));
  return NextResponse.json(quickBooksStatus(settings));
}

export async function POST(request: NextRequest) {
  await requireUser();
  if (process.env.QUICKBOOKS_ENABLED !== "true") {
    return NextResponse.json({ error: "QuickBooks is disabled. Set QUICKBOOKS_ENABLED=true and configure OAuth credentials before syncing." }, { status: 400 });
  }
  const body = await request.json();
  const action = String(body.action ?? "");
  if (action === "create-estimate") {
    const job = await prisma.job.findUnique({ where: { id: String(body.jobId) } });
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    if (job.quickBooksEstimateId) return NextResponse.json({ error: "A QuickBooks estimate is already linked to this job." }, { status: 409 });
  }
  if (action === "convert-invoice") {
    const job = await prisma.job.findUnique({ where: { id: String(body.jobId) } });
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    if (job.quickBooksInvoiceId) return NextResponse.json({ error: "A QuickBooks invoice is already linked to this job." }, { status: 409 });
  }
  return NextResponse.json({ error: "QuickBooks OAuth/client implementation is not configured on this server." }, { status: 501 });
}
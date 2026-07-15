import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { archiveResource, createResource, deleteResource, duplicateResource, resourcePayload, updateResource } from "@/lib/management/server";

export async function GET(_: NextRequest, context: { params: Promise<{ resource: string }> }) {
  await requireUser();
  const { resource } = await context.params;
  return NextResponse.json(await resourcePayload(resource));
}

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  await requireUser();
  const { resource } = await context.params;
  const body = await request.json();
  const action = body.action ?? "create";
  if (action === "create") await createResource(resource, body.data ?? {});
  else if (action === "update") await updateResource(resource, String(body.id), body.data ?? {});
  else if (action === "delete") await deleteResource(resource, String(body.id));
  else if (action === "duplicate") await duplicateResource(resource, String(body.id));
  else if (action === "archive") await archiveResource(resource, String(body.id), true);
  else if (action === "restore") await archiveResource(resource, String(body.id), false);
  else if (action === "bulk-archive") await Promise.all((body.ids ?? []).map((id: string) => archiveResource(resource, id, true)));
  else if (action === "bulk-restore") await Promise.all((body.ids ?? []).map((id: string) => archiveResource(resource, id, false)));
  else if (action === "bulk-delete") await Promise.all((body.ids ?? []).map((id: string) => deleteResource(resource, id)));
  else return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  return NextResponse.json(await resourcePayload(resource));
}
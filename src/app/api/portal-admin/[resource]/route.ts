import { NextRequest, NextResponse } from "next/server";
import { requireInternalPortalUser } from "@/lib/portal/authz";
import { archivePortalResource, createPortalResource, deletePortalResource, portalPayload, updatePortalResource } from "@/lib/portal/crud-server";
import { portalResources } from "@/lib/portal/crud-config";

export async function GET(_request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  await requireInternalPortalUser();
  const { resource } = await context.params;
  if (!portalResources[resource]) return NextResponse.json({ error: "Unknown portal resource." }, { status: 404 });
  return NextResponse.json(await portalPayload(resource));
}

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  const user = await requireInternalPortalUser();
  const { resource } = await context.params;
  if (!portalResources[resource]) return NextResponse.json({ error: "Unknown portal resource." }, { status: 404 });
  const body = await request.json();
  try {
    let generatedLink: string | undefined;
    if (body.action === "create") {
      const created = await createPortalResource(resource, body.data ?? {}, user.id) as { generatedLink?: string };
      generatedLink = created.generatedLink;
    }
    else if (body.action === "update") await updatePortalResource(resource, String(body.id), body.data ?? {});
    else if (body.action === "archive") await archivePortalResource(resource, String(body.id), true);
    else if (body.action === "restore") await archivePortalResource(resource, String(body.id), false);
    else if (body.action === "delete") await deletePortalResource(resource, String(body.id));
    else return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    const payload = await portalPayload(resource);
    return NextResponse.json({ ...payload, generatedLink });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Portal CRUD operation failed." }, { status: 400 });
  }
}




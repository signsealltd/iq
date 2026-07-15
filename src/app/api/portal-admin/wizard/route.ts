import { NextRequest, NextResponse } from "next/server";
import { requireInternalPortalUser } from "@/lib/portal/authz";
import { createPortalResource, portalPayload } from "@/lib/portal/crud-server";

export async function POST(request: NextRequest) {
  const user = await requireInternalPortalUser();
  const body = await request.json();
  try {
    const client = await createPortalResource("clients", { company: body.clientName, contactName: body.contactName, email: body.contactEmail, phone: body.contactPhone, billingAddress: body.billingAddress, notes: body.internalNotes, portalEnabled: true }, user.id) as { id: string };
    const programme = await createPortalResource("programmes", { customerId: client.id, name: body.programmeName, summary: body.programmeSummary, status: "ACTIVE", targetCompletionDate: body.targetCompletionDate }, user.id) as { id: string };
    const project = await createPortalResource("projects", { programmeId: programme.id, name: body.projectName, description: body.projectDescription, status: "INITIAL_ENQUIRY", targetDate: body.projectTargetDate }, user.id) as { id: string };
    const site = await createPortalResource("sites", { projectId: project.id, name: body.siteName, address: body.siteAddress, contactName: body.siteContact, status: "INITIAL_ENQUIRY", progress: 0, notes: body.siteNotes }, user.id) as { id: string };
    if (body.inviteEmail) await createPortalResource("users", { customerId: client.id, name: body.inviteName || body.contactName || body.inviteEmail, email: body.inviteEmail, active: true }, user.id);
    return NextResponse.json({ clientId: client.id, programmeId: programme.id, projectId: project.id, siteId: site.id, payload: await portalPayload("clients") });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create portal." }, { status: 400 });
  }
}

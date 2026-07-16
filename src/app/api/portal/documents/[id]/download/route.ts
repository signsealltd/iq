import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProject, canSeeVisibility } from "@/lib/portal/security";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const document = await prisma.portalDocument.findUnique({
    where: { id },
    include: { project: { include: { programme: true } } }
  });

  if (!document || !canAccessProject(user, document.project.programme.customerId) || !canSeeVisibility(user, document.visibility)) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const filePath = resolvePortalUpload(document.storageKey);
  if (!filePath) return NextResponse.json({ error: "Document file is not available for download." }, { status: 404 });

  try {
    const [file, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    return new Response(file, {
      headers: {
        "Content-Type": document.contentType || "application/octet-stream",
        "Content-Length": String(info.size),
        "Content-Disposition": `inline; filename="${headerFilename(document.filename)}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Document file is missing from storage." }, { status: 404 });
  }
}

function resolvePortalUpload(storageKey: string) {
  if (!storageKey.startsWith("/uploads/portal/")) return null;

  const publicRoot = path.resolve(process.cwd(), "public");
  const uploadsRoot = path.resolve(publicRoot, "uploads", "portal");
  const resolved = path.resolve(publicRoot, `.${storageKey}`);
  if (resolved !== uploadsRoot && !resolved.startsWith(`${uploadsRoot}${path.sep}`)) return null;
  return resolved;
}

function headerFilename(filename: string) {
  return filename.replace(/["\\\r\n]/g, "_");
}
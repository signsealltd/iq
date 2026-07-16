import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { importCustomers, previewCustomerImport } from "@/lib/management/customer-import";
import { resourcePayload } from "@/lib/management/server";

export async function POST(request: NextRequest) {
  await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "preview");
  if (!(file instanceof File)) return NextResponse.json({ error: "Upload a QuickBooks customer export file." }, { status: 400 });

  try {
    if (mode === "import") {
      const result = await importCustomers(file);
      const payload = await resourcePayload("customers");
      return NextResponse.json({ ...result, rows: payload.rows, lookups: payload.lookups });
    }
    return NextResponse.json(await previewCustomerImport(file));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to import customers." }, { status: 400 });
  }
}

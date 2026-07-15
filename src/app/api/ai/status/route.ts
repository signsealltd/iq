import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ configured: false, error: "Not signed in." }, { status: 401 });

  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return NextResponse.json({
    configured,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini"
  });
}

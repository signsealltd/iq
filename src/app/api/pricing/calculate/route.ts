import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPricingContext } from "@/lib/pricing/context";
import { calculatePricing } from "@/lib/pricing/engine";
import { pricingInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  await requireUser();
  const body = await request.json();
  const input = pricingInputSchema.parse(body);
  const context = await getPricingContext();
  return NextResponse.json(calculatePricing(input, context));
}

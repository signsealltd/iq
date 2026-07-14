import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { askPricingAdvisor } from "@/lib/openai/advisor";
import { getPricingContext } from "@/lib/pricing/context";
import { calculatePricing } from "@/lib/pricing/engine";
import { prisma } from "@/lib/prisma";
import { findSimilarJobs } from "@/lib/quotes";
import { rateLimit } from "@/lib/rate-limit";
import { pricingInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const ip = (await headers()).get("x-forwarded-for") ?? user.id;
  if (!rateLimit(`ai:${ip}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "AI advisor rate limit exceeded." }, { status: 429 });
  }
  const body = await request.json();
  const input = pricingInputSchema.parse(body);
  const context = await getPricingContext();
  const pricing = calculatePricing(input, context);
  const [matrixMatches, similarJobs] = await Promise.all([
    prisma.pricingMatrixEntry.findMany({ where: { active: true, jobCategory: input.jobCategory }, take: 5 }),
    findSimilarJobs({ jobCategory: input.jobCategory })
  ]);
  try {
    const advice = await askPricingAdvisor({ job: input, pricing, matrixMatches, similarJobs });
    return NextResponse.json(advice);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI advisor failed." }, { status: 400 });
  }
}

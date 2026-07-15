import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentUser } from "@/lib/auth";
import { askPricingAdvisor } from "@/lib/openai/advisor";
import { getPricingContext } from "@/lib/pricing/context";
import { calculatePricing } from "@/lib/pricing/engine";
import { prisma } from "@/lib/prisma";
import { findSimilarJobs } from "@/lib/quotes";
import { rateLimit } from "@/lib/rate-limit";
import { pricingInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before using the AI pricing advisor." }, { status: 401 });

    const ip = (await headers()).get("x-forwarded-for") ?? user.id;
    if (!rateLimit(`ai:${ip}`, 10, 60 * 60 * 1000).ok) {
      return NextResponse.json({ error: "AI advisor rate limit exceeded. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const input = pricingInputSchema.parse(body);
    const context = await getPricingContext();
    const pricing = calculatePricing(input, context);
    const [matrixMatches, similarJobs, materialDefaults, completedJobs] = await Promise.all([
      prisma.pricingMatrixEntry.findMany({ where: { active: true, archivedAt: null, jobCategory: input.jobCategory }, take: 8 }),
      findSimilarJobs({ jobCategory: input.jobCategory }),
      prisma.material.findMany({ where: { active: true, archivedAt: null }, include: { supplier: true }, take: 20 }),
      prisma.job.findMany({ where: { workflowStatus: "COMPLETED" }, include: { customer: true, quote: true }, orderBy: { completionDate: "desc" }, take: 12 })
    ]);
    const utilisation = completedJobs.length
      ? {
          averageEstimatedHours: completedJobs.reduce((sum, job) => sum + Number(job.estimatedHours), 0) / completedJobs.length,
          averageActualHours: completedJobs.reduce((sum, job) => sum + Number(job.actualHours ?? 0), 0) / completedJobs.length,
          jobsWithOverrun: completedJobs.filter((job) => job.actualHours && Number(job.actualHours) > Number(job.estimatedHours)).length
        }
      : { averageEstimatedHours: 0, averageActualHours: 0, jobsWithOverrun: 0 };

    const advice = await askPricingAdvisor({
      job: input,
      pricing,
      matrixMatches,
      similarJobs,
      materialDefaults: materialDefaults.map((material) => ({ name: material.name, sku: material.sku, category: material.category, unitCost: Number(material.unitCost), costPerSqm: material.costPerSqm ? Number(material.costPerSqm) : null, supplier: material.supplier?.name })),
      customerHistory: completedJobs.map((job) => ({ customer: job.customer.company, quotedPrice: Number(job.quotedPrice), estimatedHours: Number(job.estimatedHours), actualHours: job.actualHours ? Number(job.actualHours) : null, margin: job.finalMargin ? Number(job.finalMargin) : null })),
      labourUtilisation: utilisation,
      competitivePositioning: "Professional quality-led signage provider; do not recommend budget-provider pricing."
    });
    return NextResponse.json(advice);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI advisor failed.";
    const status = message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

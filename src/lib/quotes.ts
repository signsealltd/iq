import "server-only";

import { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function nextQuoteNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: `SS-${year}-` } }
  });
  return `SS-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function findSimilarJobs(input: { jobCategory: string; vehicleType?: string; coverageType?: string; customerId?: string }) {
  return prisma.quote.findMany({
    where: {
      jobCategory: input.jobCategory,
      OR: [
        input.vehicleType ? { vehicleType: input.vehicleType } : {},
        input.coverageType ? { coverageType: input.coverageType } : {},
        input.customerId ? { customerId: input.customerId } : {}
      ],
      status: { in: [QuoteStatus.ACCEPTED, QuoteStatus.CONVERTED_TO_JOB] }
    },
    include: { customer: true, job: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });
}

export async function convertQuoteToJob(quoteId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (quote.status !== QuoteStatus.ACCEPTED && quote.status !== QuoteStatus.SENT) {
      throw new Error("Only sent or accepted quotes can be converted to jobs.");
    }
    const job = await tx.job.create({
      data: {
        quoteId: quote.id,
        customerId: quote.customerId,
        quotedPrice: quote.finalPrice,
        estimatedCosts: quote.pricingSnapshot && typeof quote.pricingSnapshot === "object" && "totalInternalEstimatedCost" in quote.pricingSnapshot
          ? Number(quote.pricingSnapshot.totalInternalEstimatedCost)
          : Number(quote.finalPrice) - Number(quote.grossProfit),
        estimatedHours: quote.pricingSnapshot && typeof quote.pricingSnapshot === "object" && "totalHours" in quote.pricingSnapshot
          ? Number(quote.pricingSnapshot.totalHours)
          : 0
      }
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.CONVERTED_TO_JOB, acceptedAt: quote.acceptedAt ?? new Date() } });
    return job;
  });
}


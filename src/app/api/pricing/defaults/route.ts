import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireUser();
  const [matrix, materials] = await Promise.all([
    prisma.pricingMatrixEntry.findMany({ where: { active: true, archivedAt: null }, orderBy: [{ jobCategory: "asc" }, { jobSubtype: "asc" }] }),
    prisma.material.findMany({ where: { active: true, archivedAt: null }, include: { supplier: true }, orderBy: { name: "asc" } })
  ]);
  return NextResponse.json({
    matrix: matrix.map((entry) => ({
      id: entry.id,
      jobCategory: entry.jobCategory,
      jobSubtype: entry.jobSubtype,
      unit: entry.unit,
      minimumPrice: Number(entry.minimumPrice),
      targetPrice: Number(entry.targetPrice),
      premiumPrice: Number(entry.premiumPrice),
      typicalMaterialCost: Number(entry.typicalMaterialCost),
      typicalLabourHours: Number(entry.typicalLabourHours),
      defaultDesignHours: Number(entry.defaultDesignHours),
      defaultProductionHours: Number(entry.defaultProductionHours),
      defaultInstallationHours: Number(entry.defaultInstallationHours),
      defaultTravelHours: Number(entry.defaultTravelHours),
      wastePercentage: Number(entry.wastePercentage)
    })),
    materials: materials.map((material) => ({
      id: material.id,
      name: material.name,
      sku: material.sku,
      category: material.category,
      supplier: material.supplier?.name,
      unit: material.unit,
      unitCost: Number(material.unitCost),
      costPerSqm: material.costPerSqm ? Number(material.costPerSqm) : null,
      defaultMarkup: Number(material.defaultMarkup)
    }))
  });
}
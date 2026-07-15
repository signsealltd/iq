import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CrudRow = Record<string, unknown> & { id: string; archived?: boolean };
export type LookupOption = { label: string; value: string };
export type ResourcePayload = { rows: CrudRow[]; lookups: Record<string, LookupOption[]> };

function money(value: unknown) {
  return value == null ? null : Number(value);
}

function dateInput(value: unknown) {
  if (!value) return null;
  return new Date(String(value)).toISOString().slice(0, 10);
}

function clean(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== ""));
}

function bool(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function numberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function dateOrNull(value: unknown) {
  if (!value) return null;
  return new Date(String(value));
}

export async function resourcePayload(resource: string): Promise<ResourcePayload> {
  const [suppliers, customers] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.customer.findMany({ orderBy: { company: "asc" }, select: { id: true, company: true } })
  ]);
  const lookups = {
    supplierId: suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id })),
    customerId: customers.map((customer) => ({ label: customer.company, value: customer.id }))
  };

  if (resource === "pricing-matrix") {
    const rows = await prisma.pricingMatrixEntry.findMany({ orderBy: [{ jobCategory: "asc" }, { jobSubtype: "asc" }] });
    return { lookups, rows: rows.map((row) => ({ ...row, minimumPrice: money(row.minimumPrice), targetPrice: money(row.targetPrice), premiumPrice: money(row.premiumPrice), typicalMaterialCost: money(row.typicalMaterialCost), typicalLabourHours: money(row.typicalLabourHours), defaultDesignHours: money(row.defaultDesignHours), defaultProductionHours: money(row.defaultProductionHours), defaultInstallationHours: money(row.defaultInstallationHours), defaultTravelHours: money(row.defaultTravelHours), wastePercentage: money(row.wastePercentage), minimumMargin: money(row.minimumMargin), targetMargin: money(row.targetMargin), archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "materials") {
    const rows = await prisma.material.findMany({ include: { supplier: true }, orderBy: { name: "asc" } });
    return { lookups, rows: rows.map((row) => ({ ...row, supplierName: row.supplier?.name ?? null, unitCost: money(row.unitCost), rollWidthMm: money(row.rollWidthMm), rollLengthM: money(row.rollLengthM), costPerSqm: money(row.costPerSqm), defaultMarkup: money(row.defaultMarkup), archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "labour-rates") {
    const rows = await prisma.labourRate.findMany({ orderBy: { name: "asc" } });
    return { lookups, rows: rows.map((row) => ({ ...row, internalCostRate: money(row.internalCostRate), customerChargeRate: money(row.customerChargeRate), minimumCharge: money(row.minimumCharge), archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "suppliers") {
    const rows = await prisma.supplier.findMany({ include: { materials: true }, orderBy: { name: "asc" } });
    return { lookups, rows: rows.map((row) => ({ ...row, materialCount: row.materials.length, defaultDiscount: money(row.defaultDiscount), archived: Boolean(row.archivedAt) })) };
  }
  if (resource === "customers") {
    const rows = await prisma.customer.findMany({ include: { quotes: true, jobs: true }, orderBy: { company: "asc" } });
    return { lookups, rows: rows.map((row) => {
      const accepted = row.quotes.filter((quote) => quote.acceptedAt);
      const lifetimeRevenue = accepted.reduce((sum, quote) => sum + Number(quote.finalPrice), 0);
      const averageMargin = accepted.length ? accepted.reduce((sum, quote) => sum + Number(quote.grossMargin), 0) / accepted.length : 0;
      return { ...row, customerSpecificDiscount: money(row.customerSpecificDiscount), quoteCount: row.quotes.length, acceptedJobs: row.jobs.length, lifetimeRevenue, averageMargin, archived: Boolean(row.archivedAt) };
    }) };
  }
  if (resource === "jobs") {
    const rows = await prisma.job.findMany({ include: { customer: true, quote: true }, orderBy: { createdAt: "desc" } });
    return { lookups, rows: rows.map((row) => ({ ...row, customerName: row.customer.company, quoteNumber: row.quote?.quoteNumber ?? "Manual", quotedPrice: money(row.quotedPrice), estimatedCosts: money(row.estimatedCosts), actualCosts: money(row.actualCosts), estimatedHours: money(row.estimatedHours), actualHours: money(row.actualHours), finalMargin: money(row.finalMargin), varianceFromEstimate: money(row.varianceFromEstimate), installationDate: dateInput(row.installationDate), completionDate: dateInput(row.completionDate), archived: Boolean(row.archivedAt) })) };
  }
  throw new Error("Unknown resource.");
}

export async function createResource(resource: string, body: Record<string, unknown>) {
  if (resource === "pricing-matrix") return prisma.pricingMatrixEntry.create({ data: pricingMatrixData(body) as Prisma.PricingMatrixEntryUncheckedCreateInput });
  if (resource === "materials") return prisma.material.create({ data: materialData(body) as Prisma.MaterialUncheckedCreateInput });
  if (resource === "labour-rates") return prisma.labourRate.create({ data: labourData(body) as Prisma.LabourRateUncheckedCreateInput });
  if (resource === "suppliers") return prisma.supplier.create({ data: supplierData(body) as Prisma.SupplierUncheckedCreateInput });
  if (resource === "customers") return prisma.customer.create({ data: customerData(body) as Prisma.CustomerUncheckedCreateInput });
  if (resource === "jobs") return prisma.job.create({ data: jobData(body) as Prisma.JobUncheckedCreateInput });
  throw new Error("Unknown resource.");
}

export async function updateResource(resource: string, id: string, body: Record<string, unknown>) {
  if (resource === "pricing-matrix") return prisma.pricingMatrixEntry.update({ where: { id }, data: pricingMatrixData(body) as Prisma.PricingMatrixEntryUncheckedCreateInput });
  if (resource === "materials") return prisma.material.update({ where: { id }, data: materialData(body) as Prisma.MaterialUncheckedCreateInput });
  if (resource === "labour-rates") return prisma.labourRate.update({ where: { id }, data: labourData(body) as Prisma.LabourRateUncheckedCreateInput });
  if (resource === "suppliers") return prisma.supplier.update({ where: { id }, data: supplierData(body) as Prisma.SupplierUncheckedCreateInput });
  if (resource === "customers") return prisma.customer.update({ where: { id }, data: customerData(body) as Prisma.CustomerUncheckedCreateInput });
  if (resource === "jobs") return prisma.job.update({ where: { id }, data: jobData(body) as Prisma.JobUncheckedCreateInput });
  throw new Error("Unknown resource.");
}

export async function deleteResource(resource: string, id: string) {
  if (resource === "pricing-matrix") return prisma.pricingMatrixEntry.delete({ where: { id } });
  if (resource === "materials") return prisma.material.delete({ where: { id } });
  if (resource === "labour-rates") return prisma.labourRate.delete({ where: { id } });
  if (resource === "suppliers") return prisma.supplier.delete({ where: { id } });
  if (resource === "customers") return prisma.customer.delete({ where: { id } });
  if (resource === "jobs") return prisma.job.delete({ where: { id } });
  throw new Error("Unknown resource.");
}

export async function archiveResource(resource: string, id: string, archived: boolean) {
  const data = { archivedAt: archived ? new Date() : null };
  if (resource === "pricing-matrix") return prisma.pricingMatrixEntry.update({ where: { id }, data });
  if (resource === "materials") return prisma.material.update({ where: { id }, data });
  if (resource === "labour-rates") return prisma.labourRate.update({ where: { id }, data });
  if (resource === "suppliers") return prisma.supplier.update({ where: { id }, data });
  if (resource === "customers") return prisma.customer.update({ where: { id }, data });
  if (resource === "jobs") return prisma.job.update({ where: { id }, data });
  throw new Error("Unknown resource.");
}

export async function duplicateResource(resource: string, id: string) {
  const payload = await resourcePayload(resource);
  const row = payload.rows.find((item) => item.id === id);
  if (!row) throw new Error("Record not found.");
  const copy: Record<string, unknown> = { ...row };
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.archived;
  delete copy.archivedAt;
  delete copy.supplierName;
  delete copy.customerName;
  delete copy.quoteNumber;
  delete copy.quoteCount;
  delete copy.acceptedJobs;
  delete copy.lifetimeRevenue;
  delete copy.averageMargin;
  delete copy.materialCount;
  if (resource === "pricing-matrix") copy.jobSubtype = `${copy.jobSubtype ?? "Record"} copy`;
  if (resource === "materials") copy.name = `${copy.name ?? "Material"} copy`;
  if (resource === "labour-rates") copy.name = `${copy.name ?? "Labour"} copy`;
  if (resource === "suppliers") copy.name = `${copy.name ?? "Supplier"} copy`;
  if (resource === "customers") copy.company = `${copy.company ?? "Customer"} copy`;
  if (resource === "jobs") copy.quoteId = null;
  return createResource(resource, copy);
}

function pricingMatrixData(body: Record<string, unknown>) {
  return clean({ jobCategory: body.jobCategory, jobSubtype: body.jobSubtype, unit: body.unit, minimumPrice: numberOrNull(body.minimumPrice) ?? 0, targetPrice: numberOrNull(body.targetPrice) ?? 0, premiumPrice: numberOrNull(body.premiumPrice) ?? 0, typicalMaterialCost: numberOrNull(body.typicalMaterialCost) ?? 0, typicalLabourHours: numberOrNull(body.typicalLabourHours) ?? 0, defaultDesignHours: numberOrNull(body.defaultDesignHours) ?? 0, defaultProductionHours: numberOrNull(body.defaultProductionHours) ?? 0, defaultInstallationHours: numberOrNull(body.defaultInstallationHours) ?? 0, defaultTravelHours: numberOrNull(body.defaultTravelHours) ?? 0, wastePercentage: numberOrNull(body.wastePercentage) ?? 0, minimumMargin: numberOrNull(body.minimumMargin) ?? 0, targetMargin: numberOrNull(body.targetMargin) ?? 0, notes: body.notes, active: body.active === undefined ? true : bool(body.active) });
}
function materialData(body: Record<string, unknown>) {
  return clean({ name: body.name, sku: body.sku, category: body.category, supplierId: body.supplierId, unit: body.unit, unitCost: numberOrNull(body.unitCost) ?? 0, rollWidthMm: numberOrNull(body.rollWidthMm), rollLengthM: numberOrNull(body.rollLengthM), costPerSqm: numberOrNull(body.costPerSqm), defaultMarkup: numberOrNull(body.defaultMarkup) ?? 0, active: body.active === undefined ? true : bool(body.active) });
}
function labourData(body: Record<string, unknown>) {
  return clean({ name: body.name, internalCostRate: numberOrNull(body.internalCostRate) ?? 0, customerChargeRate: numberOrNull(body.customerChargeRate) ?? 0, minimumCharge: numberOrNull(body.minimumCharge) ?? 0, chargeIncrementMinutes: numberOrNull(body.chargeIncrementMinutes) ?? 15, active: body.active === undefined ? true : bool(body.active) });
}
function supplierData(body: Record<string, unknown>) {
  return clean({ name: body.name, contactName: body.contactName, email: body.email, phone: body.phone, address: body.address, leadTimeDays: numberOrNull(body.leadTimeDays), defaultDiscount: numberOrNull(body.defaultDiscount) ?? 0, notes: body.notes, active: body.active === undefined ? true : bool(body.active) });
}
function customerData(body: Record<string, unknown>) {
  return clean({ company: body.company, contactName: body.contactName, email: body.email, phone: body.phone, billingAddress: body.billingAddress, vatNumber: body.vatNumber, customerType: body.customerType ?? "COMMERCIAL", customerSpecificDiscount: numberOrNull(body.customerSpecificDiscount) ?? 0, discountLevel: body.discountLevel, preferredPricingProfile: body.preferredPricingProfile, pricingNotes: body.pricingNotes, notes: body.notes });
}
function jobData(body: Record<string, unknown>) {
  return clean({ quoteId: body.quoteId, customerId: body.customerId, quotedPrice: numberOrNull(body.quotedPrice) ?? 0, estimatedCosts: numberOrNull(body.estimatedCosts) ?? 0, actualCosts: numberOrNull(body.actualCosts), estimatedHours: numberOrNull(body.estimatedHours) ?? 0, actualHours: numberOrNull(body.actualHours), installationDate: dateOrNull(body.installationDate), completionDate: dateOrNull(body.completionDate), notes: body.notes, workflowStatus: body.workflowStatus ?? "QUOTE", invoiceStatus: body.invoiceStatus ?? "NOT_CREATED", quickBooksEstimateId: body.quickBooksEstimateId, quickBooksInvoiceId: body.quickBooksInvoiceId });
}


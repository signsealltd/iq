import { z } from "zod";
import { jobCategories, overrideReasons } from "@/lib/constants";

const money = z.coerce.number().finite().min(0).max(10_000_000);
const hours = z.coerce.number().finite().min(0).max(10_000);

export const costLineSchema = z.object({
  description: z.string().trim().min(1).max(200),
  supplier: z.string().trim().max(120).optional().default(""),
  quantity: z.coerce.number().positive().max(100_000),
  unitCost: money,
  markup: z.coerce.number().min(0).max(10),
  vatTreatment: z.enum(["STANDARD", "ZERO", "EXEMPT", "OUT_OF_SCOPE"]).default("STANDARD"),
  internalNotes: z.string().trim().max(1000).optional().default("")
});

export const pricingInputSchema = z.object({
  customerType: z.enum(["RETAIL", "TRADE", "FLEET", "COMMERCIAL", "PUBLIC_SECTOR", "INTERNAL"]).default("COMMERCIAL"),
  returningCustomer: z.boolean().default(false),
  strategicCustomer: z.boolean().default(false),
  priceSensitiveCustomer: z.boolean().default(false),
  jobCategory: z.enum(jobCategories),
  jobSubtype: z.string().trim().max(120).optional().default(""),
  quantity: z.coerce.number().int().positive().max(100_000).default(1),
  installed: z.boolean().default(true),
  urgency: z.enum(["standard", "rush", "weekend"]).default("standard"),
  difficultAccess: z.boolean().default(false),
  materialLines: z.array(costLineSchema).default([]),
  consumableLines: z.array(costLineSchema).default([]),
  outsourcedLines: z.array(costLineSchema).default([]),
  equipmentHire: money.default(0),
  delivery: money.default(0),
  otherCosts: money.default(0),
  designHours: hours.default(0),
  artworkHours: hours.default(0),
  productionHours: hours.default(0),
  manufactureHours: hours.default(0),
  installationHours: hours.default(0),
  seniorInstallationHours: hours.default(0),
  electricalHours: hours.default(0),
  travelHours: hours.default(0),
  surveyHours: hours.default(0),
  projectManagementHours: hours.default(0),
  numberOfInstallers: z.coerce.number().int().min(1).max(20).default(1),
  travelMileage: z.coerce.number().min(0).max(100_000).default(0),
  mileageRate: money.default(0.65),
  wastagePercentage: z.coerce.number().min(0).max(1).default(0.08),
  contingency: money.default(0),
  manualOverridePrice: money.optional(),
  overrideReason: z.enum(overrideReasons).optional()
});

export const aiAdvisorResponseSchema = z.object({
  minimumPrice: z.number().nonnegative(),
  recommendedPrice: z.number().nonnegative(),
  premiumPrice: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  reasoning: z.array(z.string()).max(10),
  risks: z.array(z.string()).max(10),
  suggestedCustomerWording: z.string().max(2000),
  warnings: z.array(z.string()).max(10)
});

export type PricingInput = z.infer<typeof pricingInputSchema>;
export type AIAdvisorResponse = z.infer<typeof aiAdvisorResponseSchema>;

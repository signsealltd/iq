import "server-only";

import { prisma } from "@/lib/prisma";
import { defaultPricingContext } from "@/lib/pricing/engine";
import type { LabourChargeRates, PricingContext, PricingRules } from "@/lib/pricing/types";

const ruleMap: Record<string, keyof PricingRules> = {
  minimum_material_markup: "minimumMaterialMarkup",
  minimum_labour_charge: "minimumLabourCharge",
  minimum_installation_charge: "minimumInstallationCharge",
  minimum_job_value: "minimumJobValue",
  target_gross_margin: "targetGrossMargin",
  minimum_gross_margin: "minimumGrossMargin",
  rush_job_percentage: "rushJobPercentage",
  weekend_premium: "weekendPremium",
  difficult_access_premium: "difficultAccessPremium",
  repeat_customer_discount: "repeatCustomerDiscount",
  trade_discount: "tradeDiscount",
  outsourced_work_markup: "outsourcedWorkMarkup",
  risk_allowance: "riskAllowance"
};

const labourMap: Record<string, keyof LabourChargeRates> = {
  Design: "design",
  "Artwork setup": "artwork",
  "Print production": "production",
  "Vinyl preparation": "production",
  "Sign manufacture": "manufacture",
  Installation: "installation",
  "Senior installation": "seniorInstallation",
  "Electrical work": "electrical",
  Travel: "travel",
  Survey: "survey",
  "Project management": "projectManagement"
};

export async function getPricingContext(): Promise<PricingContext> {
  const [rules, rates] = await Promise.all([
    prisma.pricingRule.findMany({ where: { active: true } }),
    prisma.labourRate.findMany({ where: { active: true } })
  ]);

  const mergedRules = { ...defaultPricingContext.rules };
  for (const rule of rules) {
    const key = ruleMap[rule.key];
    if (key) mergedRules[key] = Number(rule.value);
  }

  const mergedRates = { ...defaultPricingContext.labourRates };
  for (const rate of rates) {
    const key = labourMap[rate.name];
    if (key) mergedRates[key] = { cost: Number(rate.internalCostRate), charge: Number(rate.customerChargeRate) };
  }

  return {
    rules: mergedRules,
    labourRates: mergedRates,
    vatRate: Number(process.env.VAT_RATE ?? "0.20")
  };
}

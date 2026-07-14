import type { PricingInput } from "@/lib/validation";

export type PricingRules = {
  minimumMaterialMarkup: number;
  minimumLabourCharge: number;
  minimumInstallationCharge: number;
  minimumJobValue: number;
  targetGrossMargin: number;
  minimumGrossMargin: number;
  rushJobPercentage: number;
  weekendPremium: number;
  difficultAccessPremium: number;
  repeatCustomerDiscount: number;
  tradeDiscount: number;
  outsourcedWorkMarkup: number;
  riskAllowance: number;
};

export type LabourChargeRates = {
  design: { cost: number; charge: number };
  artwork: { cost: number; charge: number };
  production: { cost: number; charge: number };
  manufacture: { cost: number; charge: number };
  installation: { cost: number; charge: number };
  seniorInstallation: { cost: number; charge: number };
  electrical: { cost: number; charge: number };
  travel: { cost: number; charge: number };
  survey: { cost: number; charge: number };
  projectManagement: { cost: number; charge: number };
};

export type PricingContext = {
  rules: PricingRules;
  labourRates: LabourChargeRates;
  vatRate: number;
};

export type PricingResult = {
  directMaterialCost: number;
  markedUpMaterialValue: number;
  labourCost: number;
  labourSellingValue: number;
  outsourcedCost: number;
  outsourcedSellingValue: number;
  travelCost: number;
  wastageAllowance: number;
  contingencyAllowance: number;
  totalInternalEstimatedCost: number;
  minimumViableSellingPrice: number;
  recommendedSellingPrice: number;
  premiumSellingPrice: number;
  finalSellingPrice: number;
  grossProfit: number;
  grossMargin: number;
  effectiveHourlyReturn: number;
  vat: number;
  totalIncludingVat: number;
  totalHours: number;
  reasoning: string[];
  breakdown: Record<string, number>;
  input: PricingInput;
};

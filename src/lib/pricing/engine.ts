import { pricingInputSchema, type PricingInput } from "@/lib/validation";
import type { PricingContext, PricingResult } from "@/lib/pricing/types";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const marginPrice = (cost: number, margin: number) => margin >= 1 ? cost : cost / (1 - margin);
const lineCost = (lines: PricingInput["materialLines"]) => lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
const lineSelling = (lines: PricingInput["materialLines"], minimumMarkup: number) =>
  lines.reduce((sum, line) => sum + line.quantity * line.unitCost * (1 + Math.max(line.markup, minimumMarkup)), 0);

export function calculatePricing(rawInput: PricingInput, context: PricingContext): PricingResult {
  const input = pricingInputSchema.parse(rawInput);
  if (input.manualOverridePrice !== undefined && !input.overrideReason) {
    throw new Error("Manual price overrides require an override reason.");
  }

  const { rules, labourRates } = context;
  const materialCost = lineCost(input.materialLines) + lineCost(input.consumableLines);
  const markedUpMaterialValue =
    lineSelling(input.materialLines, rules.minimumMaterialMarkup) +
    lineSelling(input.consumableLines, rules.minimumMaterialMarkup);

  const outsourcedCost = lineCost(input.outsourcedLines);
  const outsourcedSellingValue = outsourcedCost * (1 + rules.outsourcedWorkMarkup);

  const labourEntries = [
    [input.designHours, labourRates.design],
    [input.artworkHours, labourRates.artwork],
    [input.productionHours, labourRates.production],
    [input.manufactureHours, labourRates.manufacture],
    [input.installationHours * input.numberOfInstallers, labourRates.installation],
    [input.seniorInstallationHours * input.numberOfInstallers, labourRates.seniorInstallation],
    [input.electricalHours, labourRates.electrical],
    [input.travelHours, labourRates.travel],
    [input.surveyHours, labourRates.survey],
    [input.projectManagementHours, labourRates.projectManagement]
  ] as const;

  const labourCost = labourEntries.reduce((sum, [hours, rate]) => sum + hours * rate.cost, 0);
  let labourSellingValue = labourEntries.reduce((sum, [hours, rate]) => sum + hours * rate.charge, 0);
  labourSellingValue = Math.max(labourSellingValue, rules.minimumLabourCharge);
  if (input.installed) labourSellingValue = Math.max(labourSellingValue, rules.minimumInstallationCharge);

  const totalHours = labourEntries.reduce((sum, [hours]) => sum + hours, 0);
  const mileageCost = input.travelMileage * input.mileageRate;
  const travelCost = input.travelHours * labourRates.travel.cost + mileageCost;
  const baseCosts = materialCost + outsourcedCost + labourCost + mileageCost + input.equipmentHire + input.delivery + input.otherCosts;
  const wastageAllowance = materialCost * input.wastagePercentage;
  const contingencyAllowance = input.contingency + baseCosts * rules.riskAllowance;
  const totalInternalEstimatedCost = baseCosts + wastageAllowance + contingencyAllowance;

  let minimumViableSellingPrice = Math.max(
    rules.minimumJobValue,
    marginPrice(totalInternalEstimatedCost, rules.minimumGrossMargin),
    markedUpMaterialValue + outsourcedSellingValue + labourSellingValue + input.equipmentHire + input.delivery + input.otherCosts
  );

  let recommendedSellingPrice = Math.max(
    minimumViableSellingPrice,
    marginPrice(totalInternalEstimatedCost, rules.targetGrossMargin),
    markedUpMaterialValue + outsourcedSellingValue + labourSellingValue + contingencyAllowance
  );

  const premiumMultiplier = 1.18;
  let premiumSellingPrice = recommendedSellingPrice * premiumMultiplier;

  const premiumReasons: string[] = [];
  if (input.urgency === "rush") {
    recommendedSellingPrice *= 1 + rules.rushJobPercentage;
    premiumSellingPrice *= 1 + rules.rushJobPercentage;
    premiumReasons.push("Rush premium applied for compressed timescale.");
  }
  if (input.urgency === "weekend") {
    recommendedSellingPrice *= 1 + rules.weekendPremium;
    premiumSellingPrice *= 1 + rules.weekendPremium;
    premiumReasons.push("Weekend premium applied.");
  }
  if (input.difficultAccess) {
    minimumViableSellingPrice *= 1 + rules.difficultAccessPremium / 2;
    recommendedSellingPrice *= 1 + rules.difficultAccessPremium;
    premiumSellingPrice *= 1 + rules.difficultAccessPremium;
    premiumReasons.push("Difficult access allowance applied.");
  }
  if (input.returningCustomer) {
    recommendedSellingPrice *= 1 - rules.repeatCustomerDiscount;
    premiumReasons.push("Returning customer discount considered after margin checks.");
  }
  if (input.customerType === "TRADE") {
    recommendedSellingPrice *= 1 - rules.tradeDiscount;
    premiumReasons.push("Trade discount considered after margin checks.");
  }

  recommendedSellingPrice = Math.max(recommendedSellingPrice, minimumViableSellingPrice);
  premiumSellingPrice = Math.max(premiumSellingPrice, recommendedSellingPrice);

  const finalSellingPrice = input.manualOverridePrice ?? recommendedSellingPrice;
  const grossProfit = finalSellingPrice - totalInternalEstimatedCost;
  const grossMargin = finalSellingPrice === 0 ? 0 : grossProfit / finalSellingPrice;
  const effectiveHourlyReturn = totalHours === 0 ? grossProfit : grossProfit / totalHours;
  const vat = finalSellingPrice * context.vatRate;

  const reasoning = [
    `Internal estimated cost is ${roundMoney(totalInternalEstimatedCost).toFixed(2)} before VAT.`,
    `Minimum viable price protects the configured minimum margin of ${(rules.minimumGrossMargin * 100).toFixed(0)}%.`,
    `Recommended price targets ${(rules.targetGrossMargin * 100).toFixed(0)}% gross margin while respecting minimum job and labour charges.`,
    ...premiumReasons
  ];
  if (input.manualOverridePrice !== undefined) {
    reasoning.push(`Manual override stored with reason: ${input.overrideReason}.`);
  }

  return {
    directMaterialCost: roundMoney(materialCost),
    markedUpMaterialValue: roundMoney(markedUpMaterialValue),
    labourCost: roundMoney(labourCost),
    labourSellingValue: roundMoney(labourSellingValue),
    outsourcedCost: roundMoney(outsourcedCost),
    outsourcedSellingValue: roundMoney(outsourcedSellingValue),
    travelCost: roundMoney(travelCost),
    wastageAllowance: roundMoney(wastageAllowance),
    contingencyAllowance: roundMoney(contingencyAllowance),
    totalInternalEstimatedCost: roundMoney(totalInternalEstimatedCost),
    minimumViableSellingPrice: roundMoney(minimumViableSellingPrice),
    recommendedSellingPrice: roundMoney(recommendedSellingPrice),
    premiumSellingPrice: roundMoney(premiumSellingPrice),
    finalSellingPrice: roundMoney(finalSellingPrice),
    grossProfit: roundMoney(grossProfit),
    grossMargin: Math.round(grossMargin * 10000) / 10000,
    effectiveHourlyReturn: roundMoney(effectiveHourlyReturn),
    vat: roundMoney(vat),
    totalIncludingVat: roundMoney(finalSellingPrice + vat),
    totalHours: roundMoney(totalHours),
    reasoning,
    breakdown: {
      materialCost: roundMoney(materialCost),
      markedUpMaterialValue: roundMoney(markedUpMaterialValue),
      labourCost: roundMoney(labourCost),
      labourSellingValue: roundMoney(labourSellingValue),
      outsourcedCost: roundMoney(outsourcedCost),
      outsourcedSellingValue: roundMoney(outsourcedSellingValue),
      mileageCost: roundMoney(mileageCost),
      equipmentHire: input.equipmentHire,
      delivery: input.delivery,
      otherCosts: input.otherCosts,
      wastageAllowance: roundMoney(wastageAllowance),
      contingencyAllowance: roundMoney(contingencyAllowance)
    },
    input
  };
}

export const defaultPricingContext: PricingContext = {
  vatRate: 0.2,
  rules: {
    minimumMaterialMarkup: 0.45,
    minimumLabourCharge: 55,
    minimumInstallationCharge: 150,
    minimumJobValue: 95,
    targetGrossMargin: 0.55,
    minimumGrossMargin: 0.35,
    rushJobPercentage: 0.15,
    weekendPremium: 0.25,
    difficultAccessPremium: 0.12,
    repeatCustomerDiscount: 0.05,
    tradeDiscount: 0.1,
    outsourcedWorkMarkup: 0.3,
    riskAllowance: 0.05
  },
  labourRates: {
    design: { cost: 28, charge: 65 },
    artwork: { cost: 24, charge: 55 },
    production: { cost: 22, charge: 58 },
    manufacture: { cost: 26, charge: 68 },
    installation: { cost: 30, charge: 75 },
    seniorInstallation: { cost: 38, charge: 92 },
    electrical: { cost: 42, charge: 105 },
    travel: { cost: 18, charge: 45 },
    survey: { cost: 30, charge: 75 },
    projectManagement: { cost: 35, charge: 85 }
  }
};

import { describe, expect, it } from "vitest";
import { calculatePricing, defaultPricingContext } from "@/lib/pricing/engine";
import type { PricingInput } from "@/lib/validation";

const baseInput: PricingInput = {
  customerType: "COMMERCIAL",
  returningCustomer: false,
  strategicCustomer: false,
  priceSensitiveCustomer: false,
  jobCategory: "Vehicle Graphics",
  jobSubtype: "Pair of van sides",
  quantity: 1,
  installed: true,
  urgency: "standard",
  difficultAccess: false,
  materialLines: [{ description: "Vinyl", supplier: "", quantity: 2, unitCost: 50, markup: 0.45, vatTreatment: "STANDARD", internalNotes: "" }],
  consumableLines: [],
  outsourcedLines: [],
  equipmentHire: 0,
  delivery: 0,
  otherCosts: 0,
  designHours: 1,
  artworkHours: 0,
  productionHours: 2,
  manufactureHours: 0,
  installationHours: 2,
  seniorInstallationHours: 0,
  electricalHours: 0,
  travelHours: 0.5,
  surveyHours: 0,
  projectManagementHours: 0,
  numberOfInstallers: 1,
  travelMileage: 10,
  mileageRate: 0.65,
  wastagePercentage: 0.08,
  contingency: 0
};

describe("calculatePricing", () => {
  it("calculates transparent selling prices and VAT", () => {
    const result = calculatePricing(baseInput, defaultPricingContext);
    expect(result.directMaterialCost).toBe(100);
    expect(result.minimumViableSellingPrice).toBeGreaterThan(result.totalInternalEstimatedCost);
    expect(result.recommendedSellingPrice).toBeGreaterThanOrEqual(result.minimumViableSellingPrice);
    expect(result.premiumSellingPrice).toBeGreaterThan(result.recommendedSellingPrice);
    expect(result.vat).toBeCloseTo(result.finalSellingPrice * 0.2, 2);
    expect(result.reasoning.length).toBeGreaterThan(2);
  });

  it("applies rush premium", () => {
    const standard = calculatePricing(baseInput, defaultPricingContext);
    const rush = calculatePricing({ ...baseInput, urgency: "rush" }, defaultPricingContext);
    expect(rush.recommendedSellingPrice).toBeGreaterThan(standard.recommendedSellingPrice);
  });

  it("requires a reason for manual overrides", () => {
    expect(() => calculatePricing({ ...baseInput, manualOverridePrice: 100 }, defaultPricingContext)).toThrow(/override reason/i);
  });
});

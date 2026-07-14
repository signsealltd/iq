import { describe, expect, it } from "vitest";
import { customerEmailWording } from "@/lib/customer-wording";
import { calculatePricing, defaultPricingContext } from "@/lib/pricing/engine";
import type { PricingInput } from "@/lib/validation";

describe("quote helpers", () => {
  it("generates customer wording from calculated pricing", () => {
    const input: PricingInput = {
      customerType: "COMMERCIAL",
      returningCustomer: false,
      strategicCustomer: false,
      priceSensitiveCustomer: false,
      jobCategory: "Banners",
      jobSubtype: "",
      quantity: 1,
      installed: false,
      urgency: "standard",
      difficultAccess: false,
      materialLines: [{ description: "Banner", supplier: "", quantity: 1, unitCost: 25, markup: 0.5, vatTreatment: "STANDARD", internalNotes: "" }],
      consumableLines: [],
      outsourcedLines: [],
      equipmentHire: 0,
      delivery: 0,
      otherCosts: 0,
      designHours: 0.5,
      artworkHours: 0,
      productionHours: 0.5,
      manufactureHours: 0,
      installationHours: 0,
      seniorInstallationHours: 0,
      electricalHours: 0,
      travelHours: 0,
      surveyHours: 0,
      projectManagementHours: 0,
      numberOfInstallers: 1,
      travelMileage: 0,
      mileageRate: 0.65,
      wastagePercentage: 0.08,
      contingency: 0
    };
    const result = calculatePricing(input, defaultPricingContext);
    expect(customerEmailWording(result, "banner print")).toContain("SignSeal");
  });
});

import { describe, expect, it } from "vitest";
import { aiAdvisorResponseSchema, pricingInputSchema } from "@/lib/validation";

describe("validation", () => {
  it("rejects invalid job categories", () => {
    expect(() => pricingInputSchema.parse({ jobCategory: "Bad category" })).toThrow();
  });

  it("validates AI advisor JSON shape", () => {
    const parsed = aiAdvisorResponseSchema.parse({
      minimumPrice: 100,
      recommendedPrice: 150,
      premiumPrice: 200,
      confidence: 0.7,
      reasoning: ["Protects margin."],
      risks: [],
      suggestedCustomerWording: "Thank you for your enquiry.",
      warnings: []
    });
    expect(parsed.recommendedPrice).toBe(150);
  });

  it("rejects AI confidence outside range", () => {
    expect(() => aiAdvisorResponseSchema.parse({
      minimumPrice: 100,
      recommendedPrice: 150,
      premiumPrice: 200,
      confidence: 1.5,
      reasoning: [],
      risks: [],
      suggestedCustomerWording: "",
      warnings: []
    })).toThrow();
  });
});

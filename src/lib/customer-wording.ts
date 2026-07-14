import type { PricingResult } from "@/lib/pricing/types";

export function customerEmailWording(result: PricingResult, jobTitle: string) {
  return `Thank you for asking SignSeal to price ${jobTitle}. Based on the materials, production time and installation requirements, our recommended quotation is £${result.finalSellingPrice.toFixed(2)} plus VAT. This allows us to complete the work properly, use suitable materials, and protect the finish expected from a professional signage installation.`;
}

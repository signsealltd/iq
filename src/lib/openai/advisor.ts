import "server-only";

import OpenAI from "openai";
import { aiAdvisorResponseSchema, type AIAdvisorResponse } from "@/lib/validation";
import type { PricingResult } from "@/lib/pricing/types";

export const AI_PROMPT_VERSION = "signseal-pricing-advisor-v1";

export async function askPricingAdvisor(payload: {
  job: Record<string, unknown>;
  pricing: PricingResult;
  matrixMatches: unknown[];
  similarJobs: unknown[];
  materialDefaults?: unknown[];
  customerHistory?: unknown[];
  labourUtilisation?: unknown;
  competitivePositioning?: unknown;
}): Promise<AIAdvisorResponse & { model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to the server environment and restart the app.");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const client = new OpenAI({ apiKey });
  let response;
  try {
    response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are SignSeal Pricing Advisor, an internal commercial pricing assistant for a UK signage and vehicle graphics company. Protect profitability while keeping quotations fair, credible and commercially competitive. Do not automatically recommend the cheapest price. Consider material costs, labour, design skill, installation complexity, risk, wastage, customer relationship, market positioning, previous comparable work and target margin. SignSeal is professional and quality-led, not a budget provider. Return concise commercial reasoning. Never invent costs or job history. When information is missing, state what is missing. Never change database records or approve quotations."
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "pricing_advice",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["minimumPrice", "recommendedPrice", "premiumPrice", "confidence", "reasoning", "risks", "suggestedCustomerWording", "warnings"],
            properties: {
              minimumPrice: { type: "number" },
              recommendedPrice: { type: "number" },
              premiumPrice: { type: "number" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              suggestedCustomerWording: { type: "string" },
              warnings: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }

  if (!response.output_text) throw new Error("OpenAI returned an empty advisor response.");
  const parsed = JSON.parse(response.output_text);
  return { ...aiAdvisorResponseSchema.parse(parsed), model };
}

function formatOpenAIError(error: unknown) {
  const detail = error as { status?: number; code?: string; message?: string; type?: string };
  const status = detail.status ? `OpenAI ${detail.status}` : "OpenAI request failed";
  const code = detail.code || detail.type;
  const message = detail.message || "No error message was returned.";
  return code ? `${status} (${code}): ${message}` : `${status}: ${message}`;
}

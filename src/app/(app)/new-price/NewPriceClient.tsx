"use client";

import { useMemo, useState } from "react";
import { Bot, Calculator, Check, WandSparkles } from "lucide-react";
import { jobCategories, overrideReasons } from "@/lib/constants";
import { gbp, percent } from "@/lib/format";
import type { AIAdvisorResponse, PricingInput } from "@/lib/validation";
import type { PricingResult } from "@/lib/pricing/types";

const initialInput: PricingInput = {
  customerType: "COMMERCIAL",
  returningCustomer: false,
  strategicCustomer: false,
  priceSensitiveCustomer: false,
  jobCategory: "Vehicle Graphics",
  jobSubtype: "",
  quantity: 1,
  installed: true,
  urgency: "standard",
  difficultAccess: false,
  materialLines: [{ description: "Vinyl/media", supplier: "", quantity: 1, unitCost: 75, markup: 0.45, vatTreatment: "STANDARD", internalNotes: "" }],
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
  projectManagementHours: 0.5,
  numberOfInstallers: 1,
  travelMileage: 10,
  mileageRate: 0.65,
  wastagePercentage: 0.08,
  contingency: 0
};

export function NewPriceClient() {
  const [input, setInput] = useState<PricingInput>(initialInput);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [advisor, setAdvisor] = useState<(AIAdvisorResponse & { model: string }) | null>(null);
  const [message, setMessage] = useState("");
  const finalPrice = useMemo(() => input.manualOverridePrice ?? result?.recommendedSellingPrice, [input.manualOverridePrice, result]);

  function setNumber<K extends keyof PricingInput>(key: K, value: string) {
    setInput((current) => ({ ...current, [key]: Number(value) } as PricingInput));
  }

  async function calculate() {
    setMessage("");
    const response = await fetch("/api/pricing/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok) {
      setMessage("Check the pricing inputs. Manual overrides need a reason.");
      return;
    }
    setResult(await response.json());
  }

  async function askAdvisor() {
    setMessage("");
    const response = await fetch("/api/ai/pricing-advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "AI advisor is not configured.");
      return;
    }
    setAdvisor(data);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
      <section className="grid gap-4">
        <div className="panel grid gap-4 p-4">
          <h2 className="font-semibold">Customer details</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Company name"><input placeholder="Company Ltd" /></Field>
            <Field label="Contact name"><input placeholder="Contact" /></Field>
            <Field label="Email"><input type="email" placeholder="name@example.com" /></Field>
            <Field label="Phone"><input placeholder="01234 567890" /></Field>
            <Field label="Customer type">
              <select value={input.customerType} onChange={(e) => setInput({ ...input, customerType: e.target.value as PricingInput["customerType"] })}>
                {["RETAIL", "TRADE", "FLEET", "COMMERCIAL", "PUBLIC_SECTOR", "INTERNAL"].map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <div className="flex flex-wrap items-end gap-4 text-sm">
              <CheckBox label="Returning" checked={input.returningCustomer} onChange={(v) => setInput({ ...input, returningCustomer: v })} />
              <CheckBox label="Strategic" checked={input.strategicCustomer} onChange={(v) => setInput({ ...input, strategicCustomer: v })} />
              <CheckBox label="Price-sensitive" checked={input.priceSensitiveCustomer} onChange={(v) => setInput({ ...input, priceSensitiveCustomer: v })} />
            </div>
          </div>
        </div>
        <div className="panel grid gap-4 p-4">
          <h2 className="font-semibold">Job details</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Job title"><input placeholder="LWB van graphics" /></Field>
            <Field label="Category">
              <select value={input.jobCategory} onChange={(e) => setInput({ ...input, jobCategory: e.target.value as PricingInput["jobCategory"] })}>
                {jobCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Subtype"><input value={input.jobSubtype} onChange={(e) => setInput({ ...input, jobSubtype: e.target.value })} /></Field>
            <Field label="Quantity"><input type="number" min="1" value={input.quantity} onChange={(e) => setNumber("quantity", e.target.value)} /></Field>
            <Field label="Urgency">
              <select value={input.urgency} onChange={(e) => setInput({ ...input, urgency: e.target.value as PricingInput["urgency"] })}>
                <option value="standard">Standard</option><option value="rush">Rush</option><option value="weekend">Weekend</option>
              </select>
            </Field>
            <Field label="Coverage"><input placeholder="Sides and rear" /></Field>
            <Field label="Location"><input placeholder="Customer site" /></Field>
            <div className="flex items-end gap-4">
              <CheckBox label="Installed" checked={input.installed} onChange={(v) => setInput({ ...input, installed: v })} />
              <CheckBox label="Difficult access" checked={input.difficultAccess} onChange={(v) => setInput({ ...input, difficultAccess: v })} />
            </div>
          </div>
        </div>
        <div className="panel grid gap-4 p-4">
          <h2 className="font-semibold">Costs and labour</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Material cost"><input type="number" value={input.materialLines[0]?.unitCost ?? 0} onChange={(e) => setInput({ ...input, materialLines: [{ ...input.materialLines[0], description: "Vinyl/media", quantity: 1, unitCost: Number(e.target.value), markup: input.materialLines[0]?.markup ?? 0.45, vatTreatment: "STANDARD", supplier: "", internalNotes: "" }] })} /></Field>
            <Field label="Material markup"><input type="number" step="0.01" value={input.materialLines[0]?.markup ?? 0.45} onChange={(e) => setInput({ ...input, materialLines: [{ ...input.materialLines[0], description: "Vinyl/media", quantity: 1, unitCost: input.materialLines[0]?.unitCost ?? 0, markup: Number(e.target.value), vatTreatment: "STANDARD", supplier: "", internalNotes: "" }] })} /></Field>
            <Field label="Outsourced cost"><input type="number" value={input.outsourcedLines[0]?.unitCost ?? 0} onChange={(e) => setInput({ ...input, outsourcedLines: Number(e.target.value) > 0 ? [{ description: "Outsourced production", quantity: 1, unitCost: Number(e.target.value), markup: 0.3, vatTreatment: "STANDARD", supplier: "", internalNotes: "" }] : [] })} /></Field>
            <Field label="Contingency"><input type="number" value={input.contingency} onChange={(e) => setNumber("contingency", e.target.value)} /></Field>
            <Field label="Design hours"><input type="number" step="0.25" value={input.designHours} onChange={(e) => setNumber("designHours", e.target.value)} /></Field>
            <Field label="Production hours"><input type="number" step="0.25" value={input.productionHours} onChange={(e) => setNumber("productionHours", e.target.value)} /></Field>
            <Field label="Install hours"><input type="number" step="0.25" value={input.installationHours} onChange={(e) => setNumber("installationHours", e.target.value)} /></Field>
            <Field label="Installers"><input type="number" value={input.numberOfInstallers} onChange={(e) => setNumber("numberOfInstallers", e.target.value)} /></Field>
            <Field label="Travel hours"><input type="number" step="0.25" value={input.travelHours} onChange={(e) => setNumber("travelHours", e.target.value)} /></Field>
            <Field label="Travel miles"><input type="number" value={input.travelMileage} onChange={(e) => setNumber("travelMileage", e.target.value)} /></Field>
            <Field label="Wastage %"><input type="number" step="0.01" value={input.wastagePercentage} onChange={(e) => setNumber("wastagePercentage", e.target.value)} /></Field>
            <Field label="Equipment hire"><input type="number" value={input.equipmentHire} onChange={(e) => setNumber("equipmentHire", e.target.value)} /></Field>
          </div>
        </div>
        <div className="sticky bottom-0 flex flex-wrap gap-2 border border-line bg-panel p-3 shadow-panel">
          <button className="button" onClick={calculate}><Calculator size={16} /> Calculate</button>
          <button className="button-secondary" onClick={askAdvisor} disabled={!result}><Bot size={16} /> Ask Pricing Advisor</button>
          {message ? <p className="self-center text-sm text-amber">{message}</p> : null}
        </div>
      </section>
      <aside className="grid gap-4 content-start">
        <div className="panel p-4">
          <h2 className="font-semibold">Pricing result</h2>
          {result ? (
            <div className="mt-3 grid gap-2 text-sm">
              <Price label="Minimum viable" value={result.minimumViableSellingPrice} />
              <Price label="Recommended" value={result.recommendedSellingPrice} strong />
              <Price label="Premium" value={result.premiumSellingPrice} />
              <Price label="Gross profit" value={result.grossProfit} />
              <div className="flex justify-between"><span>Gross margin</span><strong>{percent(result.grossMargin)}</strong></div>
              <Price label="Effective hourly return" value={result.effectiveHourlyReturn} />
              <Price label="VAT" value={result.vat} />
              <Price label="Total inc VAT" value={result.totalIncludingVat} strong />
              <div className="mt-2 border-t border-line pt-2">
                <label>Manual override</label>
                <input className="mt-1 w-full" type="number" value={input.manualOverridePrice ?? ""} onChange={(e) => setInput({ ...input, manualOverridePrice: e.target.value ? Number(e.target.value) : undefined })} placeholder={String(finalPrice ?? "")} />
                <select className="mt-2 w-full" value={input.overrideReason ?? ""} onChange={(e) => setInput({ ...input, overrideReason: e.target.value as PricingInput["overrideReason"] })}>
                  <option value="">Override reason</option>
                  {overrideReasons.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </div>
              <ul className="mt-2 list-disc pl-5 text-steel">{result.reasoning.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ) : <p className="mt-2 text-sm text-steel">Enter the job details and calculate a price.</p>}
        </div>
        <div className="panel p-4">
          <h2 className="flex items-center gap-2 font-semibold"><WandSparkles size={16} /> AI Pricing Advisor</h2>
          {advisor ? (
            <div className="mt-3 grid gap-2 text-sm">
              <Price label="AI minimum" value={advisor.minimumPrice} />
              <Price label="AI recommended" value={advisor.recommendedPrice} strong />
              <Price label="AI premium" value={advisor.premiumPrice} />
              <div className="flex justify-between"><span>Confidence</span><strong>{percent(advisor.confidence)}</strong></div>
              <button className="button" onClick={() => setInput({ ...input, manualOverridePrice: advisor.recommendedPrice, overrideReason: "Director discretion" })}><Check size={16} /> Apply recommendation</button>
              <p className="font-semibold">Reasons</p>
              <ul className="list-disc pl-5 text-steel">{advisor.reasoning.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="font-semibold">Customer wording</p>
              <p className="text-steel">{advisor.suggestedCustomerWording}</p>
            </div>
          ) : <p className="mt-2 text-sm text-steel">Not configured unless OPENAI_API_KEY is set. Advisor recommendations are never applied automatically.</p>}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1"><label>{label}</label>{children}</div>;
}

function CheckBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 normal-case tracking-normal text-ink"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" /> {label}</label>;
}

function Price({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className="flex justify-between"><span>{label}</span><strong className={strong ? "text-lg" : ""}>{gbp(value)}</strong></div>;
}

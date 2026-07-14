import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PricingMatrixPage() {
  const entries = await prisma.pricingMatrixEntry.findMany({ orderBy: [{ jobCategory: "asc" }, { jobSubtype: "asc" }] });
  return (
    <>
      <PageHeader title="Pricing Matrix" description="Editable seed values for common job types. These are examples, not hard-coded final prices." />
      <section className="panel overflow-auto">
        <table>
          <thead><tr><th>Category</th><th>Subtype</th><th>Unit</th><th>Minimum</th><th>Target</th><th>Premium</th><th>Typical material</th><th>Typical hours</th><th>Min margin</th><th>Target margin</th><th>Active</th></tr></thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.jobCategory}</td><td>{entry.jobSubtype}</td><td>{entry.unit}</td>
                <td>{gbp(entry.minimumPrice.toString())}</td><td>{gbp(entry.targetPrice.toString())}</td><td>{gbp(entry.premiumPrice.toString())}</td>
                <td>{gbp(entry.typicalMaterialCost.toString())}</td><td>{entry.typicalLabourHours.toString()}</td>
                <td>{percent(entry.minimumMargin.toString())}</td><td>{percent(entry.targetMargin.toString())}</td><td>{entry.active ? "Yes" : "No"}</td>
              </tr>
            ))}
            {entries.length === 0 ? <EmptyRow colSpan={11} text="Run the seed command to create editable pricing matrix examples." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

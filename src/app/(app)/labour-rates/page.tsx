import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LabourRatesPage() {
  const rates = await prisma.labourRate.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Labour Rates" description="Separate internal cost rates and customer charge rates." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Rate</th><th>Internal cost/hr</th><th>Customer charge/hr</th><th>Active</th></tr></thead>
          <tbody>
            {rates.map((rate) => <tr key={rate.id}><td>{rate.name}</td><td>{gbp(rate.internalCostRate.toString())}</td><td>{gbp(rate.customerChargeRate.toString())}</td><td>{rate.active ? "Yes" : "No"}</td></tr>)}
            {rates.length === 0 ? <EmptyRow colSpan={4} text="Run the seed command to create labour rates." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

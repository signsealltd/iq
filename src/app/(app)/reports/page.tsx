import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import { gbp, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [quotes, jobs] = await Promise.all([
    prisma.quote.findMany({ include: { customer: true } }),
    prisma.job.findMany({ include: { quote: true, customer: true } })
  ]);
  const accepted = quotes.filter((quote) => quote.acceptedAt);
  const rejected = quotes.filter((quote) => quote.rejectedAt);
  const quotedRevenue = quotes.reduce((sum, quote) => sum + Number(quote.finalPrice), 0);
  const acceptedRevenue = accepted.reduce((sum, quote) => sum + Number(quote.finalPrice), 0);
  const avgMargin = quotes.length ? quotes.reduce((sum, quote) => sum + Number(quote.grossMargin), 0) / quotes.length : 0;
  const belowMinimum = quotes.filter((quote) => Number(quote.grossMargin) < 0.35);
  const byType = Object.values(
    quotes.reduce<Record<string, { type: string; count: number; value: number; margin: number }>>((acc, quote) => {
      acc[quote.jobCategory] ??= { type: quote.jobCategory, count: 0, value: 0, margin: 0 };
      acc[quote.jobCategory].count += 1;
      acc[quote.jobCategory].value += Number(quote.finalPrice);
      acc[quote.jobCategory].margin += Number(quote.grossMargin);
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader title="Reports" description="Commercial reporting for acceptance, revenue, margin and estimate variance." />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Quote acceptance rate" value={percent(quotes.length ? accepted.length / quotes.length : 0)} />
        <Stat label="Revenue quoted" value={gbp(quotedRevenue)} />
        <Stat label="Revenue accepted" value={gbp(acceptedRevenue)} />
        <Stat label="Average margin" value={percent(avgMargin)} />
        <Stat label="Jobs below minimum margin" value={String(belowMinimum.length)} tone="warn" />
        <Stat label="Lost quotes" value={String(rejected.length)} />
        <Stat label="Estimated vs actual jobs" value={String(jobs.filter((job) => job.actualCosts || job.actualHours).length)} />
        <Stat label="Repeat-customer value" value={gbp(accepted.filter((quote) => quote.customer.customerSpecificDiscount).reduce((sum, quote) => sum + Number(quote.finalPrice), 0))} />
      </section>
      <section className="panel mt-4 overflow-hidden">
        <div className="border-b border-line px-4 py-3 font-semibold">Margin by job type</div>
        <table>
          <thead><tr><th>Job type</th><th>Quotes</th><th>Revenue</th><th>Average margin</th></tr></thead>
          <tbody>
            {byType.map((row) => <tr key={row.type}><td>{row.type}</td><td>{row.count}</td><td>{gbp(row.value)}</td><td>{percent(row.margin / row.count)}</td></tr>)}
            {byType.length === 0 ? <tr><td colSpan={4} className="text-steel">No report data yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

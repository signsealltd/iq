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
  const byType = Object.values(quotes.reduce<Record<string, { label: string; value: number; count: number; margin: number }>>((acc, quote) => {
    acc[quote.jobCategory] ??= { label: quote.jobCategory, value: 0, count: 0, margin: 0 };
    acc[quote.jobCategory].value += Number(quote.finalPrice);
    acc[quote.jobCategory].count += 1;
    acc[quote.jobCategory].margin += Number(quote.grossMargin);
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 8);
  const byCustomer = Object.values(accepted.reduce<Record<string, { label: string; value: number; count: number }>>((acc, quote) => {
    acc[quote.customer.company] ??= { label: quote.customer.company, value: 0, count: 0 };
    acc[quote.customer.company].value += Number(quote.finalPrice);
    acc[quote.customer.company].count += 1;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 8);
  const monthly = Object.values(quotes.reduce<Record<string, { label: string; quoted: number; accepted: number }>>((acc, quote) => {
    const label = quote.createdAt.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    acc[label] ??= { label, quoted: 0, accepted: 0 };
    acc[label].quoted += Number(quote.finalPrice);
    if (quote.acceptedAt) acc[label].accepted += Number(quote.finalPrice);
    return acc;
  }, {})).slice(-12);
  const labourVariance = jobs.filter((job) => job.actualHours).map((job) => ({ label: job.quote?.jobTitle ?? job.customer.company, value: Number(job.actualHours) - Number(job.estimatedHours), count: 1 })).slice(0, 8);

  return (
    <>
      <PageHeader title="Reports" description="Interactive management views for revenue, conversion, margin and production variance." />
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
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Chart title="Revenue" rows={[{ label: "Quoted", value: quotedRevenue, count: quotes.length }, { label: "Accepted", value: acceptedRevenue, count: accepted.length }]} money />
        <Chart title="Quote conversion" rows={[{ label: "Accepted", value: accepted.length, count: accepted.length }, { label: "Rejected", value: rejected.length, count: rejected.length }, { label: "Open", value: Math.max(0, quotes.length - accepted.length - rejected.length), count: quotes.length }]} />
        <Chart title="Margin by job type" rows={byType.map((row) => ({ ...row, value: row.margin / row.count }))} percentValue />
        <Chart title="Top customers" rows={byCustomer} money />
        <MonthlyChart rows={monthly} />
        <Chart title="Estimated vs actual labour" rows={labourVariance} suffix=" hrs" />
      </section>
    </>
  );
}

function Chart({ title, rows, money = false, percentValue = false, suffix = "" }: { title: string; rows: { label: string; value: number; count: number }[]; money?: boolean; percentValue?: boolean; suffix?: string }) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  return (
    <div className="panel p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <div className="flex justify-between gap-3 text-sm"><span className="truncate text-steel">{row.label}</span><strong>{money ? gbp(row.value) : percentValue ? percent(row.value) : `${row.value.toFixed(row.value % 1 ? 1 : 0)}${suffix}`}</strong></div>
            <div className="h-2 rounded-full bg-elevated"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, Math.abs(row.value) / max * 100)}%` }} /></div>
          </div>
        )) : <p className="text-sm text-steel">No report data yet.</p>}
      </div>
    </div>
  );
}

function MonthlyChart({ rows }: { rows: { label: string; quoted: number; accepted: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => Math.max(row.quoted, row.accepted)));
  return (
    <div className="panel p-4">
      <h2 className="font-semibold">Monthly trends</h2>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <div className="flex justify-between text-sm"><span className="text-steel">{row.label}</span><span>{gbp(row.accepted)} accepted</span></div>
            <div className="grid gap-1"><div className="h-2 rounded-full bg-elevated"><div className="h-2 rounded-full bg-steel" style={{ width: `${row.quoted / max * 100}%` }} /></div><div className="h-2 rounded-full bg-elevated"><div className="h-2 rounded-full bg-accent" style={{ width: `${row.accepted / max * 100}%` }} /></div></div>
          </div>
        )) : <p className="text-sm text-steel">No monthly data yet.</p>}
      </div>
    </div>
  );
}
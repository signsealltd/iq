import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, PoundSterling, Plus, TrendingUp } from "lucide-react";
import { QuoteStatus } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import { gbp, percent, ukDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [awaiting, acceptedMonth, quotedMonth, recent, belowTarget] = await Promise.all([
    prisma.quote.count({ where: { status: { in: [QuoteStatus.DRAFT, QuoteStatus.SENT] } } }),
    prisma.quote.findMany({ where: { acceptedAt: { gte: monthStart } } }),
    prisma.quote.findMany({ where: { createdAt: { gte: monthStart } } }),
    prisma.quote.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.quote.count({ where: { grossMargin: { lt: 0.35 } } })
  ]);
  const acceptedTotal = acceptedMonth.reduce((sum, quote) => sum + Number(quote.finalPrice), 0);
  const quotedTotal = quotedMonth.reduce((sum, quote) => sum + Number(quote.finalPrice), 0);
  const acceptanceRate = quotedMonth.length === 0 ? 0 : acceptedMonth.length / quotedMonth.length;
  const avgMargin = quotedMonth.length === 0 ? 0 : quotedMonth.reduce((sum, quote) => sum + Number(quote.grossMargin), 0) / quotedMonth.length;
  const avgValue = quotedMonth.length === 0 ? 0 : quotedTotal / quotedMonth.length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Quote pipeline, margin health and recent pricing activity."
        action={<Link className="button" href="/new-price"><Plus size={16} /> New Price</Link>}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting approval" value={String(awaiting)} icon={Clock} />
        <Stat label="Accepted this month" value={String(acceptedMonth.length)} icon={CheckCircle2} tone="success" />
        <Stat label="Acceptance rate" value={percent(acceptanceRate)} icon={TrendingUp} />
        <Stat label="Average gross margin" value={percent(avgMargin)} icon={TrendingUp} />
        <Stat label="Average job value" value={gbp(avgValue)} icon={PoundSterling} />
        <Stat label="Revenue quoted" value={gbp(quotedTotal)} icon={PoundSterling} />
        <Stat label="Revenue accepted" value={gbp(acceptedTotal)} icon={CheckCircle2} tone="success" />
        <Stat label="Below target margin" value={String(belowTarget)} icon={AlertTriangle} tone="warn" />
      </section>
      <section className="panel mt-4 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Recent activity</h2>
            <p className="text-xs text-steel">Latest quotes and pricing outcomes.</p>
          </div>
          <Link href="/quotes" className="button-secondary w-full sm:w-auto">View quotes</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Quote</th><th>Customer</th><th>Status</th><th>Value</th><th>Margin</th><th>Created</th></tr></thead>
            <tbody>
              {recent.map((quote) => (
                <tr key={quote.id}>
                  <td className="font-semibold">{quote.quoteNumber}</td>
                  <td>{quote.customer.company}</td>
                  <td>{quote.status.replaceAll("_", " ")}</td>
                  <td>{gbp(quote.finalPrice.toString())}</td>
                  <td>{percent(quote.grossMargin.toString())}</td>
                  <td>{ukDate(quote.createdAt)}</td>
                </tr>
              ))}
              {recent.length === 0 ? <tr><td colSpan={6} className="text-steel">No quotes yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
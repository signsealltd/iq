import Link from "next/link";
import { Plus } from "lucide-react";
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
        description="Current quote pipeline, margin health and recent activity."
        action={<Link className="button" href="/new-price"><Plus size={16} /> New Price</Link>}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting approval" value={String(awaiting)} />
        <Stat label="Accepted this month" value={String(acceptedMonth.length)} />
        <Stat label="Acceptance rate" value={percent(acceptanceRate)} />
        <Stat label="Average gross margin" value={percent(avgMargin)} />
        <Stat label="Average job value" value={gbp(avgValue)} />
        <Stat label="Revenue quoted" value={gbp(quotedTotal)} />
        <Stat label="Revenue accepted" value={gbp(acceptedTotal)} />
        <Stat label="Below target margin" value={String(belowTarget)} tone="warn" />
      </section>
      <section className="panel mt-4 overflow-hidden">
        <div className="border-b border-line px-4 py-3 font-semibold">Recent quotes</div>
        <table>
          <thead><tr><th>Quote</th><th>Customer</th><th>Status</th><th>Value</th><th>Margin</th><th>Created</th></tr></thead>
          <tbody>
            {recent.map((quote) => (
              <tr key={quote.id}>
                <td>{quote.quoteNumber}</td>
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
      </section>
    </>
  );
}

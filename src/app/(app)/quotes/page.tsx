import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp, percent, ukDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageHeader title="Quotes" description="Drafts, sent quotes, outcomes, revisions and conversion status." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Quote</th><th>Customer</th><th>Job</th><th>Status</th><th>Final</th><th>VAT</th><th>Total</th><th>Margin</th><th>Expiry</th></tr></thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td>{quote.quoteNumber}</td>
                <td>{quote.customer.company}</td>
                <td>{quote.jobTitle}</td>
                <td>{quote.status.replaceAll("_", " ")}</td>
                <td>{gbp(quote.finalPrice.toString())}</td>
                <td>{gbp(quote.vat.toString())}</td>
                <td>{gbp(quote.total.toString())}</td>
                <td>{percent(quote.grossMargin.toString())}</td>
                <td>{ukDate(quote.expiryDate)}</td>
              </tr>
            ))}
            {quotes.length === 0 ? <EmptyRow colSpan={9} text="No quotes yet. Use New Price to calculate one, then save quote creation can be wired to your approval process." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

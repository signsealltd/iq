import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp, percent, ukDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ include: { quotes: true, jobs: true }, orderBy: { company: "asc" } });
  return (
    <>
      <PageHeader title="Customers" description="Customer pricing notes, history and commercial performance." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Company</th><th>Contact</th><th>Type</th><th>Quotes</th><th>Accepted jobs</th><th>Average order</th><th>Average margin</th><th>Last job</th><th>Discount</th></tr></thead>
          <tbody>
            {customers.map((customer) => {
              const accepted = customer.quotes.filter((quote) => quote.acceptedAt);
              const avgOrder = accepted.length ? accepted.reduce((sum, quote) => sum + Number(quote.finalPrice), 0) / accepted.length : 0;
              const avgMargin = accepted.length ? accepted.reduce((sum, quote) => sum + Number(quote.grossMargin), 0) / accepted.length : 0;
              return (
                <tr key={customer.id}>
                  <td>{customer.company}</td>
                  <td>{customer.contactName ?? "-"}<br /><span className="text-xs text-steel">{customer.email ?? ""}</span></td>
                  <td>{customer.customerType.replaceAll("_", " ")}</td>
                  <td>{customer.quotes.length}</td>
                  <td>{customer.jobs.length}</td>
                  <td>{gbp(avgOrder)}</td>
                  <td>{percent(avgMargin)}</td>
                  <td>{ukDate(customer.jobs[0]?.completionDate)}</td>
                  <td>{percent(customer.customerSpecificDiscount.toString())}</td>
                </tr>
              );
            })}
            {customers.length === 0 ? <EmptyRow colSpan={9} text="No customers yet." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

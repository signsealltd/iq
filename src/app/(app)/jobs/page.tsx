import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp, percent, ukDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({ include: { quote: true, customer: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageHeader title="Jobs" description="Accepted quote performance against estimated costs and hours." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Quote</th><th>Customer</th><th>Quoted</th><th>Est. costs</th><th>Actual costs</th><th>Est. hours</th><th>Actual hours</th><th>Final margin</th><th>Completion</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.quote.quoteNumber}</td>
                <td>{job.customer.company}</td>
                <td>{gbp(job.quotedPrice.toString())}</td>
                <td>{gbp(job.estimatedCosts.toString())}</td>
                <td>{job.actualCosts ? gbp(job.actualCosts.toString()) : "-"}</td>
                <td>{job.estimatedHours.toString()}</td>
                <td>{job.actualHours?.toString() ?? "-"}</td>
                <td>{job.finalMargin ? percent(job.finalMargin.toString()) : "-"}</td>
                <td>{ukDate(job.completionDate)}</td>
              </tr>
            ))}
            {jobs.length === 0 ? <EmptyRow colSpan={9} text="No accepted quotes have been converted to jobs yet." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

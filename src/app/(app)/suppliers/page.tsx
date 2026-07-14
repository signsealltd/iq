import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({ include: { materials: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Suppliers" description="Supplier contact details and linked materials." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Materials</th><th>Active</th></tr></thead>
          <tbody>
            {suppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.name}</td><td>{supplier.email ?? "-"}</td><td>{supplier.phone ?? "-"}</td><td>{supplier.materials.length}</td><td>{supplier.active ? "Yes" : "No"}</td></tr>)}
            {suppliers.length === 0 ? <EmptyRow colSpan={5} text="No suppliers yet." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

import { PageHeader } from "@/components/PageHeader";
import { EmptyRow } from "@/components/EmptyRow";
import { gbp, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({ include: { supplier: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Materials" description="Material costs, suppliers, units and default markups." />
      <section className="panel overflow-hidden">
        <table>
          <thead><tr><th>Name</th><th>SKU</th><th>Supplier</th><th>Unit</th><th>Unit cost</th><th>Default markup</th><th>Active</th></tr></thead>
          <tbody>
            {materials.map((material) => <tr key={material.id}><td>{material.name}</td><td>{material.sku ?? "-"}</td><td>{material.supplier?.name ?? "-"}</td><td>{material.unit}</td><td>{gbp(material.unitCost.toString())}</td><td>{percent(material.defaultMarkup.toString())}</td><td>{material.active ? "Yes" : "No"}</td></tr>)}
            {materials.length === 0 ? <EmptyRow colSpan={7} text="No materials yet." /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

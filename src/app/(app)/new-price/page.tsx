import { PageHeader } from "@/components/PageHeader";
import { NewPriceClient } from "./NewPriceClient";

export default function NewPricePage() {
  return (
    <>
      <PageHeader title="New Price" description="Guided pricing form with transparent rule-based calculations and optional AI advice." />
      <NewPriceClient />
    </>
  );
}

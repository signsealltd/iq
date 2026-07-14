import { PageHeader } from "@/components/PageHeader";
import { quickBooksStatus } from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";
import { ukDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const qb = quickBooksStatus({
    quickbooksCompanyId: map.quickbooks_company_id,
    quickbooksClientId: map.quickbooks_client_id,
    quickbooksRedirectUri: map.quickbooks_redirect_uri,
    quickbooksLastSyncTime: map.quickbooks_last_sync_time
  });
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  return (
    <>
      <PageHeader title="Settings" description="Security, integrations and commercial configuration status." />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-4">
          <h2 className="font-semibold">OpenAI Pricing Advisor</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Status" value={openAiConfigured ? "Configured" : "Not configured"} />
            <Row label="Model" value={process.env.OPENAI_MODEL || "gpt-4.1-mini"} />
            <Row label="Key exposure" value="Server only" />
          </dl>
        </section>
        <section className="panel p-4">
          <h2 className="font-semibold">QuickBooks</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Feature flag" value={qb.enabled ? "Enabled" : "Disabled"} />
            <Row label="Connection status" value={qb.connectionStatus} />
            <Row label="Company ID" value={map.quickbooks_company_id ? "Set" : "Not configured"} />
            <Row label="Client ID" value={map.quickbooks_client_id ? "Set" : "Not configured"} />
            <Row label="Client secret" value="Encrypted setting required; never stored in plain text" />
            <Row label="Redirect URI" value={map.quickbooks_redirect_uri ?? "Not configured"} />
            <Row label="Last sync" value={qb.lastSyncTime ? ukDate(qb.lastSyncTime) : "Never"} />
          </dl>
        </section>
        <section className="panel p-4 xl:col-span-2">
          <h2 className="font-semibold">Security notes</h2>
          <p className="mt-2 text-sm text-steel">Login is required, public registration is disabled, sessions use secure HTTP-only cookies in production, login and AI endpoints are rate limited, and all pricing/API inputs are validated server-side.</p>
        </section>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-steel">{label}</dt><dd className="font-medium text-right">{value}</dd></div>;
}

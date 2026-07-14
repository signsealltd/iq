export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warn" }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className={tone === "warn" ? "mt-1 text-2xl font-bold text-amber" : "mt-1 text-2xl font-bold text-ink"}>{value}</p>
    </div>
  );
}

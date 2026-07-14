import type { LucideIcon } from "lucide-react";

export function Stat({ label, value, tone = "default", icon: Icon }: { label: string; value: string; tone?: "default" | "warn" | "success"; icon?: LucideIcon }) {
  const valueClass = tone === "warn" ? "text-amber" : tone === "success" ? "text-success" : "text-ink";
  return (
    <div className="panel flex min-h-24 items-start justify-between gap-3 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
      </div>
      {Icon ? <span className="flex h-9 w-9 items-center justify-center rounded-md bg-elevated text-accent"><Icon size={18} /></span> : null}
    </div>
  );
}
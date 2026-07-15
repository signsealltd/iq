import Link from "next/link";
import { SignSealLogo } from "@/components/SignSealLogo";

export function PortalShell({ user, children }: { user: { name: string; role: string }; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href={"/portal" as never} className="flex items-center gap-3">
            <SignSealLogo compact />
            <div>
              <p className="text-sm font-bold">SignSeal Project Portal</p>
              <p className="text-xs text-steel">Project updates, approvals and documents</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm text-steel">
            <Link className="button-secondary" href={"/portal" as never}>Dashboard</Link>
            {user.role !== "CLIENT" ? <Link className="button-secondary" href={"/portal-admin" as never}>Internal admin</Link> : null}
            <span>{user.name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 md:py-6">{children}</main>
    </div>
  );
}

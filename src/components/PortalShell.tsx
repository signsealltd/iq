import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(app)/actions";
import { InstallAppButton } from "@/components/InstallAppButton";
import { SignSealLogo } from "@/components/SignSealLogo";

export function PortalShell({ user, children }: { user: { name: string; role: string }; children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-page text-ink">
      <header className="border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl min-w-0 flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href={"/portal" as never} className="flex min-w-0 items-center gap-3">
            <SignSealLogo compact />
            <div className="min-w-0">
              <p className="break-words text-sm font-bold">SignSeal Project Portal</p>
              <p className="break-words text-xs text-steel">Project updates, approvals and documents</p>
            </div>
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-steel">
            <Link className="button-secondary" href={"/portal" as never}>Dashboard</Link>
            {user.role !== "CLIENT" ? <Link className="button-secondary" href={"/portal-admin" as never}>Internal admin</Link> : null}
            <span className="break-words">{user.name}</span>
            <InstallAppButton />
            <form action={logoutAction}>
              <button className="button-secondary min-h-9 px-3" type="submit">
                <LogOut size={16} /> Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl min-w-0 px-4 py-5 md:py-6">{children}</main>
    </div>
  );
}

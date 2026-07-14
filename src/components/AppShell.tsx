"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, ClipboardList, Factory, FileText, Gauge, Home, LogOut, Menu, Settings, Truck, Users, Wrench, X } from "lucide-react";
import { useState } from "react";
import { AppearanceToggle } from "@/components/AppearanceToggle";
import { SignSealLogo } from "@/components/SignSealLogo";
import { logoutAction } from "@/app/(app)/actions";

const nav = [
  ["/dashboard", "Dashboard", Home],
  ["/new-price", "New Price", Calculator],
  ["/quotes", "Quotes", FileText],
  ["/customers", "Customers", Users],
  ["/jobs", "Jobs", ClipboardList],
  ["/pricing-matrix", "Pricing Matrix", Gauge],
  ["/materials", "Materials", Truck],
  ["/labour-rates", "Labour Rates", Wrench],
  ["/suppliers", "Suppliers", Factory],
  ["/reports", "Reports", ClipboardList],
  ["/settings", "Settings", Settings]
] as const;

type ShellUser = { name: string; email: string; role: string };

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-page text-ink">
      <Sidebar user={user} />
      <MobileHeader openMenu={() => setOpen(true)} />
      {open ? <MobileDrawer user={user} closeMenu={() => setOpen(false)} /> : null}
      <div className="md:pl-20 xl:pl-72">
        <main className="p-4 pb-24 md:p-5 xl:p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ user }: { user: ShellUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-line bg-panel md:flex xl:w-72">
      <div className="border-b border-line p-3 xl:p-4">
        <div className="hidden xl:block"><SignSealLogo /></div>
        <div className="xl:hidden"><SignSealLogo compact /></div>
        <p className="mt-3 hidden text-xs font-semibold uppercase tracking-wide text-steel xl:block">SignSeal IQ</p>
      </div>
      <NavLinks />
      <div className="mt-auto grid gap-3 border-t border-line p-3 xl:p-4">
        <AppearanceToggle />
        <div className="hidden rounded-lg border border-line bg-elevated p-3 xl:block">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-steel">{user.role.replace("_", " ")}</p>
        </div>
        <form action={logoutAction}>
          <button className="button-secondary w-full" title="Log out">
            <LogOut size={16} /> <span className="hidden xl:inline">Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function MobileHeader({ openMenu }: { openMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-panel/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <SignSealLogo compact />
        <div>
          <p className="text-sm font-bold">SignSeal IQ</p>
          <p className="text-xs text-steel">Internal management</p>
        </div>
      </div>
      <button className="button-secondary px-3" type="button" onClick={openMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>
    </header>
  );
}

function MobileDrawer({ user, closeMenu }: { user: ShellUser; closeMenu: () => void }) {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button className="absolute inset-0 bg-black/60" type="button" aria-label="Close navigation" onClick={closeMenu} />
      <aside className="absolute inset-y-0 left-0 flex w-[min(90vw,22rem)] flex-col border-r border-line bg-panel p-4 shadow-panel">
        <div className="flex items-center justify-between">
          <SignSealLogo />
          <button className="button-secondary px-3" type="button" onClick={closeMenu} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="mt-4"><NavLinks onNavigate={closeMenu} expanded /></div>
        <div className="mt-auto grid gap-3 border-t border-line pt-4">
          <AppearanceToggle />
          <div className="rounded-lg border border-line bg-elevated p-3">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-steel">{user.role.replace("_", " ")}</p>
          </div>
          <form action={logoutAction}>
            <button className="button-secondary w-full"><LogOut size={16} /> Log out</button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function NavLinks({ onNavigate, expanded = false }: { onNavigate?: () => void; expanded?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1 p-2 xl:p-3">
      {nav.map(([href, label, Icon]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={label}
            className={active ? "focus-ring flex min-h-11 items-center gap-3 rounded-md bg-accent px-3 text-sm font-semibold text-white" : "focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-steel hover:bg-elevated hover:text-ink"}
          >
            <Icon size={17} />
            <span className={expanded ? "inline" : "hidden xl:inline"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator, ClipboardList, Factory, FileText, Gauge, Home, LogOut, Settings, Truck, Users, Wrench } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { logoutAction } from "./actions";

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
  ["/settings", "Settings", Settings],
  ["/reports", "Reports", ClipboardList]
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">
        <div className="border-b border-line px-5 py-4">
          <p className="text-lg font-bold">SignSeal</p>
          <p className="text-xs text-steel">Pricing Assist</p>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-cloud">
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <div className="lg:hidden">
            <p className="font-bold">SignSeal Pricing Assist</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-steel">{user.role.replace("_", " ")}</p>
          </div>
          <form action={logoutAction}>
            <button className="button-secondary" title="Log out">
              <LogOut size={16} /> Log out
            </button>
          </form>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

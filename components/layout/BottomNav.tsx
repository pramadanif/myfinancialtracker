"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Plus, Calendar, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "@/components/layout/QuickAddProvider";

const sideTabs = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/transactions", label: "Transaksi", icon: List },
];

const rightTabs = [
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/reports", label: "Laporan", icon: PieChart },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();

  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav shadow-nav safe-area-bottom">
      <div className="flex items-end justify-around h-[68px] max-w-lg mx-auto px-1">
        {sideTabs.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 transition-colors min-w-0",
                active ? "text-primary" : "text-text-tertiary"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all",
                active && "bg-primary-50"
              )}>
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              </div>
              <span className={cn("text-2xs font-medium", active && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => openQuickAdd()}
          className="flex flex-col items-center justify-center flex-1 -mt-5"
          aria-label="Tambah transaksi"
        >
          <div className="w-[52px] h-[52px] rounded-full bg-primary text-white shadow-fab flex items-center justify-center ring-4 ring-white active:scale-95 transition-transform duration-150">
            <Plus size={26} strokeWidth={2.5} />
          </div>
          <span className="text-2xs font-semibold text-primary mt-1">Tambah</span>
        </button>

        {rightTabs.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 transition-colors min-w-0",
                active ? "text-primary" : "text-text-tertiary"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all",
                active && "bg-primary-50"
              )}>
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              </div>
              <span className={cn("text-2xs font-medium", active && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

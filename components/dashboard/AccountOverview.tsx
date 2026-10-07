"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrencyShort } from "@/lib/utils";
import { AccountIconBox } from "@/components/ui/DynamicIcon";
import SectionHeader from "@/components/ui/SectionHeader";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { Account } from "@prisma/client";

export type AccountWithChange = Account & {
  weeklyChange?: number;
};

interface AccountOverviewProps {
  accounts: AccountWithChange[];
  onTotalChange?: (total: number) => void;
}

export default function AccountOverview({ accounts, onTotalChange }: AccountOverviewProps) {
  const { notifyDataChange } = useDataRefresh();
  const [excluded, setExcluded] = useState<Set<string>>(
    () => new Set(accounts.filter((a) => a.excludeFromTotal).map((a) => a.id))
  );

  useEffect(() => {
    setExcluded(new Set(accounts.filter((a) => a.excludeFromTotal).map((a) => a.id)));
  }, [accounts]);

  useEffect(() => {
    const visibleTotal = accounts
      .filter((a) => !excluded.has(a.id))
      .reduce((sum, a) => sum + a.currentBalance, 0);
    onTotalChange?.(visibleTotal);
  }, [accounts, excluded, onTotalChange]);

  const toggleVisibility = async (id: string) => {
    const excludeFromTotal = !excluded.has(id);
    setExcluded((prev) => {
      const next = new Set(prev);
      if (excludeFromTotal) next.add(id);
      else next.delete(id);
      return next;
    });
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludeFromTotal }),
    });
    if (res.ok) notifyDataChange();
  };

  return (
    <div>
      <SectionHeader title="Akun Saya" action={{ label: "Budget", href: "/budget" }} />
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x scrollbar-hide overscroll-x-contain">
        {accounts.map((account) => {
          const isHidden = excluded.has(account.id);
          const change = account.weeklyChange ?? 0;

          return (
            <div
              key={account.id}
              className={`flex-shrink-0 w-[168px] snap-start surface-card p-4 transition-opacity ${
                isHidden ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <AccountIconBox accountName={account.name} colorTag={account.colorTag} size="sm" />
                <button
                  onClick={() => toggleVisibility(account.id)}
                  className="text-text-tertiary hover:text-text-secondary p-0.5 transition-colors"
                  aria-label={isHidden ? "Hitung akun ke saldo" : "Sembunyikan akun dari saldo"}
                >
                  {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Link href={`/transactions?accountId=${account.id}`}>
                <p className="text-xs font-medium text-text-tertiary">{account.name}</p>
                <p className="text-xl font-bold text-text-primary mt-0.5 tabular-nums tracking-tight">
                  {formatCurrencyShort(account.currentBalance)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {change > 0 ? (
                    <TrendingUp size={11} className="text-status-safe" />
                  ) : change < 0 ? (
                    <TrendingDown size={11} className="text-status-danger" />
                  ) : (
                    <Minus size={11} className="text-text-tertiary" />
                  )}
                  <span className={`text-2xs font-medium ${
                    change > 0 ? "text-status-safe" : change < 0 ? "text-status-danger" : "text-text-tertiary"
                  }`}>
                    {change !== 0 ? formatCurrencyShort(Math.abs(change)) : "Stabil"} · minggu ini
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

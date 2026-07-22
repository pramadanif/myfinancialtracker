"use client";

import { Wallet } from "lucide-react";
import { formatCurrency, formatCurrencyLedger, formatCurrencyShort, cn } from "@/lib/utils";

interface AccountBalance {
  name: string;
  currentBalance: number;
  colorTag: string;
}

interface TransactionSummaryBarProps {
  income: number;
  expense: number;
  netto: number;
  accountBalance: number;
  accountLabel?: string;
  accounts?: AccountBalance[];
  showBreakdown?: boolean;
}

const ACCOUNT_ORDER = ["BCA", "Seabank", "Cash"];

function sortAccounts(accounts: AccountBalance[]) {
  return [...accounts].sort((a, b) => {
    const ia = ACCOUNT_ORDER.indexOf(a.name);
    const ib = ACCOUNT_ORDER.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export default function TransactionSummaryBar({
  income,
  expense,
  netto,
  accountBalance,
  accountLabel,
  accounts = [],
  showBreakdown = false,
}: TransactionSummaryBarProps) {
  const breakdown = sortAccounts(accounts);

  return (
    <div className="border-b border-border-light">
      {/* Saldo akun */}
      <div className="px-4 pt-1.5 pb-2 bg-background-secondary">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary-dark px-3 py-2.5 text-white shadow-button">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 opacity-90 min-w-0">
                <Wallet size={13} strokeWidth={2} className="shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider truncate">Saldo Akun</span>
              </div>
              {accountLabel && (
                <span className="text-[10px] font-medium bg-white/15 px-1.5 py-px rounded-full shrink-0">
                  {accountLabel}
                </span>
              )}
            </div>
            <p className="text-lg font-bold mt-1 tabular-nums tracking-tight leading-tight">
              {formatCurrency(accountBalance)}
            </p>

            {showBreakdown && breakdown.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/15 grid grid-cols-3 gap-1">
                {breakdown.map((account, i) => (
                  <div
                    key={account.name}
                    className={cn(
                      "min-w-0 px-1",
                      i > 0 && "border-l border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: account.colorTag }}
                      />
                      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70 truncate">
                        {account.name}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold tabular-nums leading-none text-center truncate">
                      {formatCurrencyShort(account.currentBalance)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pemasukan / Pengeluaran / Netto */}
      <div className="grid grid-cols-3 bg-white">
        {[
          { label: "Pemasukan", value: income, color: "text-primary" },
          { label: "Pengeluaran", value: expense, color: "text-status-danger" },
          { label: "Netto", value: netto, color: netto >= 0 ? "text-text-primary" : "text-status-danger" },
        ].map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "py-3 px-2 text-center",
              i < 2 && "border-r border-border-light"
            )}
          >
            <p className="text-balance-header">{item.label}</p>
            <p className={cn("text-xs font-bold mt-1 tabular-nums", item.color)}>
              {formatCurrencyLedger(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

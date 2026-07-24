"use client";

import { CalendarDays, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import Input from "@/components/ui/Input";
import Numpad from "@/components/ui/Numpad";
import AmountShortcutBar from "@/components/transactions/AmountShortcutBar";
import AccountSelector from "@/components/ui/AccountSelector";
import CategoryGrid from "@/components/ui/CategoryGrid";
import { formatCurrency, cn } from "@/lib/utils";
import { toISODateString, todayAppDateString, addDays, parseAppDayStart } from "@/lib/dates";
import type { Account, Category } from "@prisma/client";

type TabType = "expense" | "income" | "transfer";

const TAB_META: Record<TabType, { label: string; icon: typeof ArrowDownLeft; active: string; amount: string; hero: string }> = {
  expense: {
    label: "Keluar",
    icon: ArrowDownLeft,
    active: "bg-status-danger text-white shadow-sm",
    amount: "text-status-danger",
    hero: "from-status-danger/10 via-white to-white border-status-danger/20",
  },
  income: {
    label: "Masuk",
    icon: ArrowUpRight,
    active: "bg-status-safe text-white shadow-sm",
    amount: "text-status-safe",
    hero: "from-status-safe/10 via-white to-white border-status-safe/20",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowLeftRight,
    active: "bg-primary text-white shadow-sm",
    amount: "text-primary",
    hero: "from-primary-50 via-white to-white border-primary/20",
  },
};

interface TransactionFormBodyProps {
  tab: TabType;
  onTabChange: (tab: TabType) => void;
  date: string;
  onDateChange: (date: string) => void;
  accountId: string;
  onAccountChange: (id: string) => void;
  fromAccountId: string;
  toAccountId: string;
  onFromAccountChange: (id: string) => void;
  onToAccountChange: (id: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  amount: number;
  onAmountChange: (value: number) => void;
  accounts: Account[];
  categories: Category[];
  showTabs?: boolean;
  hideTransfer?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

export default function TransactionFormBody({
  tab,
  onTabChange,
  date,
  onDateChange,
  accountId,
  onAccountChange,
  fromAccountId,
  toAccountId,
  onFromAccountChange,
  onToAccountChange,
  categoryId,
  onCategoryChange,
  description,
  onDescriptionChange,
  amount,
  onAmountChange,
  accounts,
  categories,
  showTabs = true,
  hideTransfer = false,
}: TransactionFormBodyProps) {
  const today = todayAppDateString();
  const yesterday = toISODateString(addDays(parseAppDayStart(today), -1));
  const meta = TAB_META[tab];
  const tabs = hideTransfer ? (["expense", "income"] as TabType[]) : (["expense", "income", "transfer"] as TabType[]);

  return (
    <div className="space-y-5">
      {/* Tanggal */}
      <div>
        <SectionLabel>Tanggal</SectionLabel>
        <div className="flex gap-2">
          {[
            { key: today, label: "Hari ini" },
            { key: yesterday, label: "Kemarin" },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => onDateChange(pill.key)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                date === pill.key
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white border-border-light text-text-secondary"
              )}
            >
              {pill.label}
            </button>
          ))}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-light bg-white text-text-secondary cursor-pointer">
            <CalendarDays size={14} />
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-medium bg-transparent border-0 p-0 w-[5.5rem] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Tipe */}
      {showTabs && (
        <div>
          <SectionLabel>Tipe</SectionLabel>
          <div className="flex gap-2">
            {tabs.map((t) => {
              const m = TAB_META[t];
              const Icon = m.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTabChange(t)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all",
                    tab === t ? m.active : "bg-white border-border-light text-text-secondary"
                  )}
                >
                  <Icon size={14} strokeWidth={2.25} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nominal */}
      <div className={cn("rounded-2xl border bg-gradient-to-b p-4", meta.hero)}>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest text-center mb-1">
          Nominal
        </p>
        <p className={cn("text-[2rem] font-bold text-center tabular-nums tracking-tight leading-none", meta.amount)}>
          {amount > 0 ? formatCurrency(amount) : "Rp0"}
        </p>
        {tab !== "transfer" && (
          <div className="mt-2">
            <AmountShortcutBar amount={amount} onSelect={onAmountChange} />
          </div>
        )}
        <div className="mt-3 -mx-1">
          <Numpad value={amount} onChange={onAmountChange} hideDisplay compact />
        </div>
      </div>

      {/* Detail */}
      <div className="space-y-4">
        <SectionLabel>Detail</SectionLabel>

        {tab === "transfer" ? (
          <div className="space-y-3">
            <div className="surface-card p-3">
              <p className="text-2xs font-semibold text-text-tertiary mb-2">Dari</p>
              <AccountSelector accounts={accounts} selectedId={fromAccountId} onSelect={onFromAccountChange} />
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                <ArrowLeftRight size={14} className="text-primary" />
              </div>
            </div>
            <div className="surface-card p-3">
              <p className="text-2xs font-semibold text-text-tertiary mb-2">Ke</p>
              <AccountSelector accounts={accounts} selectedId={toAccountId} onSelect={onToAccountChange} />
            </div>
          </div>
        ) : (
          <>
            <div className="surface-card p-3">
              <p className="text-2xs font-semibold text-text-tertiary mb-2">Akun</p>
              <AccountSelector accounts={accounts} selectedId={accountId} onSelect={onAccountChange} />
            </div>
            <div className="surface-card p-3">
              <p className="text-2xs font-semibold text-text-tertiary mb-2">Kategori</p>
              <CategoryGrid categories={categories} selectedId={categoryId} onSelect={onCategoryChange} />
            </div>
          </>
        )}

        <Input
          label="Deskripsi"
          placeholder="Catatan opsional..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  );
}

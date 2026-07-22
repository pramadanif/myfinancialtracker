"use client";

import { Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Numpad from "@/components/ui/Numpad";
import AccountSelector from "@/components/ui/AccountSelector";
import CategoryGrid from "@/components/ui/CategoryGrid";
import { formatCurrency, cn } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import type { Account, Category } from "@prisma/client";

type TabType = "expense" | "income" | "transfer";

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
  error?: string;
  loading?: boolean;
  submitLabel: string;
  onSubmit: () => void;
  showTabs?: boolean;
  hideTransfer?: boolean;
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
  error,
  loading,
  submitLabel,
  onSubmit,
  showTabs = true,
  hideTransfer = false,
}: TransactionFormBodyProps) {
  const setToday = () => onDateChange(toISODateString(new Date()));
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    onDateChange(toISODateString(d));
  };

  const today = toISODateString(new Date());
  const yesterday = toISODateString((() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })());

  return (
    <div className="space-y-4">
      {/* Tanggal — paling atas */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Tanggal</p>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={setToday}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors",
              date === today ? "bg-primary text-white border-primary" : "bg-white border-border-light text-text-secondary"
            )}
          >
            Hari ini
          </button>
          <button
            type="button"
            onClick={setYesterday}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors",
              date === yesterday ? "bg-primary text-white border-primary" : "bg-white border-border-light text-text-secondary"
            )}
          >
            Kemarin
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-text-tertiary shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-white text-sm"
          />
        </div>
      </div>

      {showTabs && (
        <div className="flex rounded-2xl bg-background-secondary p-1 gap-0.5">
          {(hideTransfer ? (["expense", "income"] as TabType[]) : (["expense", "income", "transfer"] as TabType[])).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                tab === t ? "bg-primary text-white shadow-button" : "text-text-secondary"
              )}
            >
              {t === "expense" ? "Keluar" : t === "income" ? "Masuk" : "Transfer"}
            </button>
          ))}
        </div>
      )}

      {/* Nominal hero + submit dekat atas */}
      <div className="rounded-2xl bg-background-secondary border border-border-light p-4">
        <p className="text-2xs text-text-tertiary uppercase tracking-wide font-semibold text-center mb-1">Nominal</p>
        <p className={cn(
          "text-3xl font-bold text-center tabular-nums tracking-tight",
          tab === "income" ? "text-status-safe" : tab === "transfer" ? "text-primary" : "text-status-danger"
        )}>
          {amount > 0 ? formatCurrency(amount) : "Rp0"}
        </p>
        <div className="mt-3">
          <Numpad value={amount} onChange={onAmountChange} />
        </div>
        <Button fullWidth size="lg" className="mt-4" onClick={onSubmit} disabled={loading || amount <= 0}>
          {loading ? "Menyimpan..." : submitLabel}
        </Button>
        {error && <p className="text-sm text-status-danger text-center font-medium mt-3">{error}</p>}
      </div>

      {tab === "transfer" ? (
        <>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Dari Akun</p>
            <AccountSelector accounts={accounts} selectedId={fromAccountId} onSelect={onFromAccountChange} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Ke Akun</p>
            <AccountSelector accounts={accounts} selectedId={toAccountId} onSelect={onToAccountChange} />
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Akun</p>
            <AccountSelector accounts={accounts} selectedId={accountId} onSelect={onAccountChange} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Kategori</p>
            <CategoryGrid categories={categories} selectedId={categoryId} onSelect={onCategoryChange} />
          </div>
        </>
      )}

      <Input
        label="Deskripsi"
        placeholder="Opsional — catatan singkat"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
    </div>
  );
}

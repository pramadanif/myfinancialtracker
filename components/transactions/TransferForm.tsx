"use client";

import { useState } from "react";
import { ArrowLeftRight, CalendarDays, ChevronDown } from "lucide-react";
import Numpad from "@/components/ui/Numpad";
import AmountShortcutBar from "@/components/transactions/AmountShortcutBar";
import { AccountIconBox } from "@/components/ui/DynamicIcon";
import { cn, formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { toISODateString, todayAppDateString, addDays, parseAppDayStart } from "@/lib/dates";
import type { Account } from "@prisma/client";

interface TransferFormProps {
  accounts: Account[];
  fromAccountId: string;
  toAccountId: string;
  onFromAccountChange: (id: string) => void;
  onToAccountChange: (id: string) => void;
  amount: number;
  onAmountChange: (value: number) => void;
  date: string;
  onDateChange: (date: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  error?: string;
}

function AccountChip({
  account,
  selected,
  onClick,
}: {
  account: Account;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl border transition-all min-w-0",
        selected
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white border-border-light text-text-primary"
      )}
    >
      <AccountIconBox
        accountName={account.name}
        colorTag={selected ? "#FFFFFF" : account.colorTag}
        size="sm"
      />
      <span className="text-[10px] font-bold truncate w-full text-center">{account.name}</span>
      <span className={cn("text-[9px] tabular-nums", selected ? "text-white/80" : "text-text-tertiary")}>
        {formatCurrencyShort(account.currentBalance)}
      </span>
    </button>
  );
}

export default function TransferForm({
  accounts,
  fromAccountId,
  toAccountId,
  onFromAccountChange,
  onToAccountChange,
  amount,
  onAmountChange,
  date,
  onDateChange,
  description,
  onDescriptionChange,
  error,
}: TransferFormProps) {
  const [showNote, setShowNote] = useState(!!description);
  const today = todayAppDateString();
  const yesterday = toISODateString(addDays(parseAppDayStart(today), -1));

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const sameAccount = fromAccountId === toAccountId && fromAccountId !== "";

  const swapAccounts = () => {
    onFromAccountChange(toAccountId);
    onToAccountChange(fromAccountId);
  };

  return (
    <div className="space-y-3">
      {/* Akun — compact 2 baris */}
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-b from-primary-50/80 to-white p-3 space-y-2">
        <div>
          <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Dari</p>
          <div className="grid grid-cols-3 gap-1.5">
            {accounts.map((a) => (
              <AccountChip
                key={`from-${a.id}`}
                account={a}
                selected={fromAccountId === a.id}
                onClick={() => onFromAccountChange(a.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapAccounts}
            className="w-8 h-8 rounded-full bg-white border border-primary/20 shadow-sm flex items-center justify-center text-primary"
            aria-label="Tukar akun"
          >
            <ArrowLeftRight size={15} strokeWidth={2.25} />
          </button>
        </div>

        <div>
          <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Ke</p>
          <div className="grid grid-cols-3 gap-1.5">
            {accounts.map((a) => (
              <AccountChip
                key={`to-${a.id}`}
                account={a}
                selected={toAccountId === a.id}
                onClick={() => onToAccountChange(a.id)}
              />
            ))}
          </div>
        </div>

        {amount > 0 && fromAccount && toAccount && !sameAccount && (
          <div className="mt-3 pt-3 border-t border-primary/10 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[9px] text-text-tertiary">Saldo {fromAccount.name}</p>
              <p className="text-xs font-bold text-status-danger tabular-nums">
                {formatCurrencyShort(Math.max(0, fromAccount.currentBalance - amount))}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-text-tertiary">Saldo {toAccount.name}</p>
              <p className="text-xs font-bold text-status-safe tabular-nums">
                {formatCurrencyShort(toAccount.currentBalance + amount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {sameAccount && (
        <p className="text-xs text-status-danger text-center font-medium">Pilih akun tujuan berbeda</p>
      )}

      {/* Nominal */}
      <div className="text-center py-1">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">Nominal</p>
        <p className="text-[1.75rem] font-bold text-primary tabular-nums leading-none">
          {amount > 0 ? formatCurrency(amount) : "Rp0"}
        </p>
      </div>

      <AmountShortcutBar amount={amount} onSelect={onAmountChange} />

      <Numpad value={amount} onChange={onAmountChange} hideDisplay compact />

      {/* Tanggal — compact */}
      <div className="flex gap-1.5">
        {[
          { key: today, label: "Hari ini" },
          { key: yesterday, label: "Kemarin" },
        ].map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onDateChange(pill.key)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[11px] font-semibold border",
              date === pill.key
                ? "bg-primary text-white border-primary"
                : "bg-white border-border-light text-text-secondary"
            )}
          >
            {pill.label}
          </button>
        ))}
        <label className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border-light bg-white text-text-secondary cursor-pointer">
          <CalendarDays size={12} />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-[11px] font-medium bg-transparent border-0 p-0 w-[5rem] cursor-pointer"
          />
        </label>
      </div>

      {/* Catatan opsional — collapsed */}
      {showNote ? (
        <input
          type="text"
          placeholder="Catatan opsional..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-border-light text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="w-full py-1.5 text-xs text-text-tertiary font-medium flex items-center justify-center gap-1"
        >
          <ChevronDown size={14} /> Tambah catatan
        </button>
      )}

      {error && <p className="text-sm text-status-danger text-center font-medium">{error}</p>}
    </div>
  );
}

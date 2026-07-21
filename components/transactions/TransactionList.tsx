"use client";

import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, formatCurrencyShort, cn } from "@/lib/utils";
import { CategoryIconBox } from "@/components/ui/DynamicIcon";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { TransactionType } from "@/types/enums";
import type { TransactionWithRelations } from "@/types";

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  onDelete?: (id: string) => void;
  showAccount?: boolean;
  emptyMessage?: string;
}

type DayGroup = {
  dateKey: string;
  label: string;
  totalExpense: number;
  totalIncome: number;
  items: TransactionWithRelations[];
};

function groupByDate(transactions: TransactionWithRelations[]): DayGroup[] {
  const map = new Map<string, TransactionWithRelations[]>();

  for (const tx of transactions) {
    const dateKey = format(new Date(tx.date), "yyyy-MM-dd");
    const existing = map.get(dateKey);
    if (existing) existing.push(tx);
    else map.set(dateKey, [tx]);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => {
      const d = parseISO(dateKey);
      let totalExpense = 0;
      let totalIncome = 0;
      for (const tx of items) {
        if (tx.type === TransactionType.DEBIT) totalExpense += tx.amount;
        if (tx.type === TransactionType.CREDIT) totalIncome += tx.amount;
      }
      return {
        dateKey,
        label: format(d, "EEEE, d MMMM yyyy", { locale: id }),
        totalExpense,
        totalIncome,
        items: items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    });
}

function getAmountPrefix(type: string) {
  if (type === TransactionType.CREDIT || type === TransactionType.TRANSFER_IN) return "+";
  if (type === TransactionType.TRANSFER_OUT) return "-";
  if (type === TransactionType.DEBIT) return "-";
  return "";
}

function getIconName(tx: TransactionWithRelations): string {
  if (tx.type === TransactionType.TRANSFER_OUT || tx.type === TransactionType.TRANSFER_IN) {
    return "arrow-left-right";
  }
  return tx.category?.iconName || "circle-dollar-sign";
}

export default function TransactionList({
  transactions,
  onDelete,
  showAccount = true,
  emptyMessage = "Tidak ada transaksi",
}: TransactionListProps) {
  const groups = groupByDate(transactions);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <DynamicIcon name="receipt" size="xl" className="mb-3 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.dateKey}>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-semibold text-text-primary capitalize">{group.label}</h3>
            <div className="text-xs text-text-secondary text-right">
              {group.totalExpense > 0 && (
                <span className="text-status-danger">-{formatCurrencyShort(group.totalExpense)}</span>
              )}
              {group.totalExpense > 0 && group.totalIncome > 0 && " · "}
              {group.totalIncome > 0 && (
                <span className="text-status-safe">+{formatCurrencyShort(group.totalIncome)}</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden divide-y divide-border">
            {group.items.map((tx) => {
              const isTransfer =
                tx.type === TransactionType.TRANSFER_OUT ||
                tx.type === TransactionType.TRANSFER_IN;
              const amountColor = isTransfer
                ? "text-primary"
                : tx.type === TransactionType.CREDIT
                  ? "text-status-safe"
                  : "text-status-danger";

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-background-secondary/50 transition-colors"
                >
                  <CategoryIconBox iconName={getIconName(tx)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {tx.category?.name || (isTransfer ? "Transfer" : tx.type)}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {tx.description ||
                        (showAccount ? tx.account.name : "") ||
                        (isTransfer ? "Transfer antar akun" : "")}
                      {showAccount && tx.description ? ` · ${tx.account.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-sm font-bold tabular-nums", amountColor)}>
                      {getAmountPrefix(tx.type)}
                      {formatCurrencyShort(tx.amount)}
                    </span>
                    {onDelete && !isTransfer && (
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="text-xs text-status-danger px-1"
                        aria-label="Hapus"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

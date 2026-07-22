"use client";

import { format, parseISO, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { formatCurrencyLedger, cn } from "@/lib/utils";
import { CategoryIconBox } from "@/components/ui/DynamicIcon";
import EmptyState from "@/components/ui/EmptyState";
import { TransactionType } from "@/types/enums";
import type { TransactionWithRelations } from "@/types";

interface TransactionLedgerProps {
  transactions: TransactionWithRelations[];
  onEdit?: (tx: TransactionWithRelations) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

type DayGroup = {
  dateKey: string;
  dayNumber: string;
  dayBadge: string;
  isWeekend: boolean;
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
      const dayOfWeek = getDay(d);
      let totalExpense = 0;
      let totalIncome = 0;

      for (const tx of items) {
        if (tx.type === TransactionType.DEBIT) totalExpense += tx.amount;
        if (tx.type === TransactionType.CREDIT) totalIncome += tx.amount;
      }

      return {
        dateKey,
        dayNumber: format(d, "d"),
        dayBadge: format(d, "EEE", { locale: enUS }),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        totalExpense,
        totalIncome,
        items: items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    });
}

function getIconName(tx: TransactionWithRelations): string {
  if (tx.type === TransactionType.TRANSFER_OUT || tx.type === TransactionType.TRANSFER_IN) {
    return "arrow-left-right";
  }
  return tx.category?.iconName || "circle-dollar-sign";
}

function getAmountColor(type: string): string {
  if (type === TransactionType.CREDIT || type === TransactionType.TRANSFER_IN) {
    return "text-status-safe";
  }
  if (type === TransactionType.TRANSFER_OUT || type === TransactionType.TRANSFER_IN) {
    return "text-primary";
  }
  return "text-status-danger";
}

export default function TransactionLedger({
  transactions,
  onEdit,
  onDelete,
  emptyMessage = "Belum ada transaksi bulan ini",
}: TransactionLedgerProps) {
  const groups = groupByDate(transactions);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="receipt"
        title={emptyMessage}
        description="Tap tombol + di bawah untuk menambah transaksi pertama"
      />
    );
  }

  return (
    <div className="space-y-3 py-2">
      {groups.map((group) => (
        <div key={group.dateKey} className="surface-card overflow-hidden">
          {/* Date header */}
          <div className="flex items-center justify-between px-4 py-3 bg-background-secondary/60 border-b border-border-light">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-text-primary leading-none tabular-nums w-7 text-center">
                {group.dayNumber}
              </span>
              <span
                className={cn(
                  "text-2xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                  group.isWeekend
                    ? "bg-primary text-white"
                    : "bg-white text-text-secondary border border-border-light"
                )}
              >
                {group.dayBadge}
              </span>
            </div>
            <div className="text-right text-xs leading-relaxed tabular-nums space-y-0.5">
              {group.totalIncome > 0 && (
                <div className="text-primary font-semibold">
                  +{formatCurrencyLedger(group.totalIncome)}
                </div>
              )}
              {group.totalExpense > 0 && (
                <div className="text-status-danger font-semibold">
                  -{formatCurrencyLedger(group.totalExpense)}
                </div>
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-light">
            {group.items.map((tx) => {
              const isTransfer =
                tx.type === TransactionType.TRANSFER_OUT ||
                tx.type === TransactionType.TRANSFER_IN;
              const categoryName = tx.category?.name || (isTransfer ? "Transfer" : "Lainnya");
              const note = tx.description?.trim();

              return (
                <div
                  key={tx.id}
                  role={onEdit ? "button" : undefined}
                  tabIndex={onEdit ? 0 : undefined}
                  onClick={() => onEdit?.(tx)}
                  onKeyDown={(e) => {
                    if (onEdit && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onEdit(tx);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-colors group",
                    onEdit && "active:bg-background-secondary/50 cursor-pointer"
                  )}
                >
                  <CategoryIconBox iconName={getIconName(tx)} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {categoryName}
                      </span>
                      {note && (
                        <span className="text-2xs font-medium px-1.5 py-0.5 rounded-md bg-background-secondary text-text-secondary truncate max-w-[100px] flex-shrink-0">
                          {note}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{tx.account.name}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={cn("text-sm font-bold tabular-nums", getAmountColor(tx.type))}>
                      {formatCurrencyLedger(tx.amount)}
                    </span>
                    {(onEdit || onDelete) && !isTransfer && (
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                            className="text-2xs text-primary font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                            className="text-2xs text-status-danger font-medium"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
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

export function computePeriodSummary(transactions: TransactionWithRelations[]) {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (tx.type === TransactionType.CREDIT) income += tx.amount;
    if (tx.type === TransactionType.DEBIT) expense += tx.amount;
  }

  return { income, expense, total: income - expense };
}

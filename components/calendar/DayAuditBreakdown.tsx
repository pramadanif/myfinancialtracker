"use client";

import DynamicIcon from "@/components/ui/DynamicIcon";
import { cn, formatCurrencyShort } from "@/lib/utils";
import type { CalendarDay } from "./calendar-utils";

interface DayAuditBreakdownProps {
  day: CalendarDay | undefined;
  value: number;
  avgPerDay: number;
}

export default function DayAuditBreakdown({ day, value, avgPerDay }: DayAuditBreakdownProps) {
  if (!day || day.total <= 0) return null;

  const diff = value - avgPerDay;
  const above = diff > 0;

  return (
    <div className="surface-card p-3.5 space-y-3">
      {avgPerDay > 0 && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2 text-xs",
            above ? "bg-status-danger-light text-status-danger" : "bg-status-safe-light text-status-safe"
          )}
        >
          <span className="font-medium">
            {above ? "Di atas" : "Di bawah"} rata-rata harian
          </span>
          <span className="font-bold tabular-nums">
            {above ? "+" : "−"}
            {formatCurrencyShort(Math.round(Math.abs(diff)))}
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {day.categories.map((c) => {
          const pct = day.total > 0 ? (c.amount / day.total) * 100 : 0;
          return (
            <div key={c.name} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <DynamicIcon name={c.iconName} size="sm" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {c.name}
                    <span className="font-normal text-text-tertiary"> · {c.count}×</span>
                  </p>
                  <p className="text-xs font-bold tabular-nums text-text-primary shrink-0">
                    {formatCurrencyShort(c.amount)}
                  </p>
                </div>
                <div className="mt-1 h-1 rounded-full bg-background-tertiary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.type === "MONTHLY_FIXED" ? "bg-slate-400" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {day.bigCount > 0 && (
        <p className="text-2xs text-text-tertiary">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-danger mr-1 align-middle" />
          {day.bigCount} transaksi ≥100rb · terbesar {formatCurrencyShort(day.maxAmount)}
        </p>
      )}
    </div>
  );
}

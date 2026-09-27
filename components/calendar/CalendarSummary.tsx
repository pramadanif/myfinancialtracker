"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import Switch from "@/components/ui/Switch";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { parseAppDayStart } from "@/lib/dates";
import type { MonthStats } from "./calendar-utils";

interface CalendarSummaryProps {
  monthLabel: string;
  stats: MonthStats;
  hideFixed: boolean;
  onHideFixedChange: (value: boolean) => void;
  onSelectDay: (dateKey: string) => void;
}

export default function CalendarSummary({
  monthLabel,
  stats,
  hideFixed,
  onHideFixedChange,
  onSelectDay,
}: CalendarSummaryProps) {
  const weekendRatio = stats.weekdayAvg > 0 ? stats.weekendAvg / stats.weekdayAvg : 0;
  const showWeekendInsight = weekendRatio >= 1.3;

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
              Pengeluaran {monthLabel}
            </p>
            <p className="text-xl font-bold text-text-primary tabular-nums tracking-tight mt-0.5">
              {formatCurrency(stats.total)}
            </p>
          </div>
          <label className="flex items-center gap-2 shrink-0 pt-0.5">
            <span className="text-[10px] font-medium text-text-secondary leading-tight text-right">
              Tanpa kos
              <br />& tagihan
            </span>
            <Switch checked={hideFixed} onChange={onHideFixedChange} aria-label="Sembunyikan pengeluaran tetap" />
          </label>
        </div>

        {hideFixed && stats.fixedTotal > 0 && (
          <p className="text-2xs text-text-tertiary mt-1">
            + pengeluaran tetap {formatCurrencyShort(stats.fixedTotal)} disembunyikan
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-border-light">
        {[
          { label: "Rata-rata/hari", value: stats.avgPerDay },
          { label: "Hari kerja", value: stats.weekdayAvg },
          { label: "Weekend", value: stats.weekendAvg },
        ].map((item, i) => (
          <div key={item.label} className={i < 2 ? "border-r border-border-light py-2.5 px-2 text-center" : "py-2.5 px-2 text-center"}>
            <p className="text-balance-header">{item.label}</p>
            <p className="text-xs font-bold text-text-primary tabular-nums mt-1">
              {formatCurrencyShort(Math.round(item.value))}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border-light bg-background-secondary/50 text-2xs">
        {stats.topDay ? (
          <button
            type="button"
            onClick={() => onSelectDay(stats.topDay!.dateKey)}
            className="flex-1 min-w-0 text-left text-text-secondary truncate"
          >
            Paling boros{" "}
            <span className="font-semibold text-text-primary capitalize">
              {format(parseAppDayStart(stats.topDay.dateKey), "EEE d", { locale: id })}
            </span>{" "}
            · <span className="font-semibold text-status-danger">{formatCurrencyShort(stats.topDay.amount)}</span>
          </button>
        ) : (
          <span className="flex-1 text-text-tertiary">Belum ada pengeluaran</span>
        )}
        {stats.bigCount > 0 && (
          <span className="shrink-0 font-medium text-text-secondary">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-danger mr-1 align-middle" />
            {stats.bigCount}× ≥100rb
          </span>
        )}
      </div>

      {showWeekendInsight && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-amber-200/70 bg-amber-50 text-2xs text-amber-900">
          <TrendingUp size={13} className="shrink-0" />
          <span>
            Weekend <span className="font-bold">{weekendRatio.toLocaleString("id-ID", { maximumFractionDigits: 1 })}×</span> lebih boros dari hari kerja
          </span>
        </div>
      )}
    </div>
  );
}

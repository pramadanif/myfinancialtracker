"use client";

import { resolveIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  HEAT_AMOUNT_TEXT,
  HEAT_CLASSES,
  auditIcons,
  dayValue,
  formatCompact,
  heatLevel,
  type CalendarDay,
} from "./calendar-utils";

interface CalendarHeatGridProps {
  dateKeys: string[];
  paddingDays: number;
  days: Record<string, CalendarDay>;
  avgPerDay: number;
  weeklyBudget: number;
  hideFixed: boolean;
  todayKey: string;
  selectedDate: string | null;
  onSelectDay: (dateKey: string) => void;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const GRID_COLS = "grid grid-cols-[repeat(7,minmax(0,1fr))_2.75rem] gap-1";

function iconColor(type: string, iconName: string) {
  if (type === "MONTHLY_FIXED") return "text-slate-500";
  if (iconName === "fuel") return "text-amber-600";
  if (type === "LIFESTYLE") return "text-violet-600";
  return "text-primary";
}

function weekTone(pct: number) {
  if (pct >= 100) return { text: "text-status-danger", bar: "bg-status-danger" };
  if (pct >= 75) return { text: "text-amber-700", bar: "bg-amber-500" };
  return { text: "text-emerald-700", bar: "bg-emerald-500" };
}

export default function CalendarHeatGrid({
  dateKeys,
  paddingDays,
  days,
  avgPerDay,
  weeklyBudget,
  hideFixed,
  todayKey,
  selectedDate,
  onSelectDay,
}: CalendarHeatGridProps) {
  const cells: (string | null)[] = [...Array(paddingDays).fill(null), ...dateKeys];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="surface-card p-2.5">
      <div className={cn(GRID_COLS, "mb-1.5")}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-center text-[10px] font-semibold py-1",
              i >= 5 ? "text-primary" : "text-text-tertiary"
            )}
          >
            {d}
          </div>
        ))}
        <div className="text-center text-[9px] font-semibold text-text-tertiary py-1 leading-tight">
          Minggu
        </div>
      </div>

      <div className="space-y-1">
        {rows.map((row, rowIndex) => {
          const weekTotal = row.reduce((sum, key) => sum + (key ? dayValue(days[key], hideFixed) : 0), 0);
          const weekPct = weeklyBudget > 0 ? (weekTotal / weeklyBudget) * 100 : 0;
          const tone = weekTone(weekPct);

          return (
            <div key={rowIndex} className={GRID_COLS}>
              {row.map((dateKey, colIndex) => {
                if (!dateKey) return <div key={`pad-${rowIndex}-${colIndex}`} />;

                const day = days[dateKey];
                const value = dayValue(day, hideFixed);
                const level = heatLevel(value, avgPerDay);
                const icons = auditIcons(day);
                const isToday = dateKey === todayKey;
                const isFuture = dateKey > todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => onSelectDay(dateKey)}
                    className={cn(
                      "relative flex flex-col items-center justify-start rounded-lg pt-1 pb-1 min-h-[58px] transition-all active:scale-95",
                      HEAT_CLASSES[level],
                      level === 0 && "hover:bg-background-secondary",
                      isToday && "ring-1 ring-primary",
                      selectedDate === dateKey && "ring-2 ring-primary",
                      isFuture && "opacity-40"
                    )}
                  >
                    {!!day?.bigCount && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-status-danger ring-1 ring-white"
                        aria-label={`${day.bigCount} transaksi di atas 100rb`}
                      />
                    )}
                    <span
                      className={cn(
                        "text-[13px] leading-none font-semibold tabular-nums",
                        isToday ? "text-primary" : "text-text-primary"
                      )}
                    >
                      {Number(dateKey.slice(8))}
                    </span>
                    {value > 0 && (
                      <span className={cn("text-[9px] font-bold tabular-nums leading-none mt-1", HEAT_AMOUNT_TEXT[level])}>
                        {formatCompact(value)}
                      </span>
                    )}
                    {icons.length > 0 && (
                      <span className="flex items-center gap-px mt-auto pt-0.5">
                        {icons.map((c) => {
                          const Icon = resolveIcon(c.iconName);
                          return (
                            <Icon
                              key={c.name}
                              size={9}
                              strokeWidth={2.5}
                              className={iconColor(c.type, c.iconName)}
                              aria-label={c.name}
                            />
                          );
                        })}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="flex flex-col items-center justify-center rounded-lg bg-background-secondary/70 px-0.5">
                {weekTotal > 0 ? (
                  <>
                    <span className={cn("text-[9px] font-bold tabular-nums leading-none", weeklyBudget > 0 ? tone.text : "text-text-primary")}>
                      {formatCompact(weekTotal)}
                    </span>
                    {weeklyBudget > 0 && (
                      <>
                        <span className="mt-1 w-full h-[3px] rounded-full bg-border overflow-hidden">
                          <span
                            className={cn("block h-full rounded-full", tone.bar)}
                            style={{ width: `${Math.min(weekPct, 100)}%` }}
                          />
                        </span>
                        <span className="text-[8px] text-text-tertiary tabular-nums mt-0.5 leading-none">
                          {Math.round(weekPct)}%
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] text-text-tertiary">–</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-border-light space-y-1.5">
        <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary">
          <span>Hemat</span>
          <div className="flex gap-0.5">
            {HEAT_CLASSES.slice(1).map((cls) => (
              <span key={cls} className={cn("w-4 h-2.5 rounded-sm", cls)} />
            ))}
          </div>
          <span>Boros</span>
          <span className="ml-auto tabular-nums">rata-rata {formatCompact(Math.round(avgPerDay))}/hari</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-danger" /> transaksi ≥100rb
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-slate-400" /> tetap
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500" /> bensin
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-violet-500" /> hiburan/belanja
          </span>
          {weeklyBudget > 0 && (
            <span className="ml-auto">budget {formatCompact(weeklyBudget)}/minggu</span>
          )}
        </div>
      </div>
    </div>
  );
}

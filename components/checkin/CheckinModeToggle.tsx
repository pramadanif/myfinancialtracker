"use client";

import { MapPin, Power } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCheckinMode } from "@/components/layout/CheckinProvider";

interface CheckinModeToggleProps {
  compact?: boolean;
  className?: string;
}

export function CheckinModeToggle({ compact = false, className }: CheckinModeToggleProps) {
  const { checkinModeActive, checkinStartedAt, loading, toggleCheckinMode } = useCheckinMode();

  return (
    <button
      type="button"
      onClick={() => toggleCheckinMode()}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-xl border transition-all active:scale-[0.98] disabled:opacity-50",
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
        checkinModeActive
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-white border-border-light text-text-secondary",
        className
      )}
      aria-pressed={checkinModeActive}
    >
      <MapPin size={compact ? 14 : 16} className={checkinModeActive ? "text-amber-600" : "text-text-tertiary"} />
      <span className="font-semibold">{checkinModeActive ? "Check-in ON" : "Check-in"}</span>
      {checkinModeActive && <Power size={12} className="text-amber-600" />}
    </button>
  );
}

export function CheckinModeBanner() {
  const { checkinModeActive, checkinStartedAt } = useCheckinMode();

  if (!checkinModeActive) return null;

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium flex items-center justify-center gap-2">
      <MapPin size={14} strokeWidth={2.25} />
      <span>
        Mode Check-in aktif
        {checkinStartedAt && (
          <> · sejak {format(new Date(checkinStartedAt), "d MMM HH:mm", { locale: id })}</>
        )}
      </span>
      <span className="opacity-80">— pengeluaran tercatat check-in</span>
    </div>
  );
}

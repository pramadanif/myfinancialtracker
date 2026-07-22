"use client";

import { MapPin, Heart, Power } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCheckinMode, usePacaranMode } from "@/components/layout/CheckinProvider";

interface ModeToggleProps {
  compact?: boolean;
  className?: string;
}

export function CheckinModeToggle({ compact = false, className }: ModeToggleProps) {
  const { checkinModeActive, loading, toggleCheckinMode } = useCheckinMode();

  return (
    <button
      type="button"
      onClick={() => toggleCheckinMode()}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border transition-all active:scale-[0.98] disabled:opacity-50",
        compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-sm",
        checkinModeActive
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-white border-border-light text-text-secondary",
        className
      )}
      aria-pressed={checkinModeActive}
    >
      <MapPin size={compact ? 13 : 16} className={checkinModeActive ? "text-amber-600" : "text-text-tertiary"} />
      <span className="font-semibold">{checkinModeActive ? "Check-in" : "Check-in"}</span>
      {checkinModeActive && <Power size={11} className="text-amber-600" />}
    </button>
  );
}

export function PacaranModeToggle({ compact = false, className }: ModeToggleProps) {
  const { pacaranModeActive, loading, togglePacaranMode } = usePacaranMode();

  return (
    <button
      type="button"
      onClick={() => togglePacaranMode()}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border transition-all active:scale-[0.98] disabled:opacity-50",
        compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-sm",
        pacaranModeActive
          ? "bg-rose-50 border-rose-300 text-rose-900"
          : "bg-white border-border-light text-text-secondary",
        className
      )}
      aria-pressed={pacaranModeActive}
    >
      <Heart size={compact ? 13 : 16} className={pacaranModeActive ? "text-rose-600 fill-rose-200" : "text-text-tertiary"} />
      <span className="font-semibold">Pacaran</span>
      {pacaranModeActive && <Power size={11} className="text-rose-600" />}
    </button>
  );
}

export function ActivityModeToggles({ compact = false, className }: ModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <CheckinModeToggle compact={compact} />
      <PacaranModeToggle compact={compact} />
    </div>
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
    </div>
  );
}

export function PacaranModeBanner() {
  const { pacaranModeActive, pacaranStartedAt } = usePacaranMode();

  if (!pacaranModeActive) return null;

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-medium flex items-center justify-center gap-2">
      <Heart size={14} strokeWidth={2.25} className="fill-white/30" />
      <span>
        Mode Pacaran aktif
        {pacaranStartedAt && (
          <> · sejak {format(new Date(pacaranStartedAt), "d MMM HH:mm", { locale: id })}</>
        )}
      </span>
      <span className="opacity-80">— makan, jajan, nonton tercatat</span>
    </div>
  );
}

export function ActivityModeBanners() {
  return (
    <>
      <CheckinModeBanner />
      <PacaranModeBanner />
    </>
  );
}

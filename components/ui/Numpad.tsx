"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface NumpadProps {
  value: number;
  onChange: (value: number) => void;
  hideDisplay?: boolean;
  compact?: boolean;
}

/**
 * Layout berdasarkan pola fintech ID (BCA / GoPay / Jenius) + ergonomi thumb:
 * - 1–9 grid atas (standar telepon, familiar)
 * - Baris bawah: 00 · 0 · hapus (zona jempol kanan)
 * - Chip ×00 / ×000 di atas grid (shortcut ribuan, tidak mengganggu ritme tombol)
 */
export default function Numpad({ value, onChange, hideDisplay = false, compact = false }: NumpadProps) {
  const handlePress = (key: string) => {
    if (key === "back") {
      const str = value.toString().slice(0, -1);
      onChange(parseInt(str, 10) || 0);
      return;
    }
    if (key === "00") {
      const newVal = value * 100;
      if (newVal <= 999999999) onChange(newVal);
      return;
    }
    if (key === "000") {
      const newVal = value * 1000;
      if (newVal <= 999999999) onChange(newVal);
      return;
    }
    const newVal = parseInt(`${value}${key}`, 10);
    if (newVal <= 999999999) onChange(newVal);
  };

  const digitClass = cn(
    "rounded-xl font-semibold border border-border-light bg-white text-text-primary",
    "transition-all active:scale-[0.97] active:bg-primary-50",
    compact ? "h-11 text-lg" : "h-[3.25rem] text-xl"
  );

  const suffixChipClass = cn(
    "flex-1 rounded-full font-semibold border transition-all active:scale-[0.97]",
    "bg-primary-50 border-primary/15 text-primary active:bg-primary-100",
    compact ? "py-1.5 text-xs" : "py-2 text-sm"
  );

  const deleteClass = cn(
    digitClass,
    "border-transparent bg-background-secondary text-text-secondary active:bg-background-tertiary",
    "flex items-center justify-center"
  );

  return (
    <div className="w-full select-none">
      {!hideDisplay && (
        <div className="text-center py-3">
          <span className="text-3xl font-bold text-text-primary tabular-nums tracking-tight">
            {value > 0 ? formatCurrency(value) : "Rp0"}
          </span>
        </div>
      )}

      {/* Shortcut ribuan — terpisah dari grid agar visual lebih rapi */}
      <div className={cn("flex gap-2 px-1", compact ? "mb-1.5" : "mb-2")}>
        <button type="button" onClick={() => handlePress("00")} className={suffixChipClass}>
          ×00
        </button>
        <button type="button" onClick={() => handlePress("000")} className={suffixChipClass}>
          ×000
        </button>
      </div>

      <div className={cn("grid grid-cols-3", compact ? "gap-1.5" : "gap-2")}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
          <button key={key} type="button" onClick={() => handlePress(key)} className={digitClass}>
            {key}
          </button>
        ))}

        {/* Baris bawah: pola telepon — 00 kiri, 0 tengah, hapus kanan (jangkauan jempol) */}
        <button type="button" onClick={() => handlePress("00")} className={digitClass}>
          00
        </button>
        <button type="button" onClick={() => handlePress("0")} className={digitClass}>
          0
        </button>
        <button
          type="button"
          onClick={() => handlePress("back")}
          className={deleteClass}
          aria-label="Hapus"
        >
          <Delete size={compact ? 18 : 22} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

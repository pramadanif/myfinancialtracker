"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrencyInput } from "@/lib/utils";

interface NumpadProps {
  value: number;
  onChange: (value: number) => void;
  hideDisplay?: boolean;
  compact?: boolean;
}

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

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "00", "0", "back"];

  return (
    <div className="w-full">
      {!hideDisplay && (
        <div className="text-center py-4">
          <span className="text-3xl font-bold text-text-primary">
            {value > 0 ? formatCurrency(value) : "Rp0"}
          </span>
        </div>
      )}
      <div className={cn("grid grid-cols-3", compact ? "gap-1.5" : "gap-2")}>
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePress(key)}
            className={cn(
              "rounded-xl font-semibold transition-all active:scale-95",
              compact ? "h-11 text-base" : "h-14 text-xl",
              key === "back" && "col-span-3",
              key === "000" && (compact ? "text-sm" : "text-lg"),
              key === "back"
                ? "bg-background-secondary text-text-secondary"
                : "bg-white border border-border-light text-text-primary active:bg-primary-50"
            )}
          >
            {key === "back" ? "⌫" : key}
          </button>
        ))}
      </div>
    </div>
  );
}

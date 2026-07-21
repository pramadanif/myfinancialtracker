"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrencyInput } from "@/lib/utils";

interface NumpadProps {
  value: number;
  onChange: (value: number) => void;
}

export default function Numpad({ value, onChange }: NumpadProps) {
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
    const newVal = parseInt(`${value}${key}`, 10);
    if (newVal <= 999999999) onChange(newVal);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

  return (
    <div className="w-full">
      <div className="text-center py-4">
        <span className="text-3xl font-bold text-text-primary">
          {value > 0 ? formatCurrency(value) : "Rp0"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePress(key)}
            className={cn(
              "h-14 rounded-xl text-xl font-semibold transition-colors active:scale-95",
              key === "back"
                ? "bg-background-secondary text-text-secondary"
                : "bg-white border border-border text-text-primary hover:bg-primary-light"
            )}
          >
            {key === "back" ? "⌫" : key}
          </button>
        ))}
      </div>
    </div>
  );
}

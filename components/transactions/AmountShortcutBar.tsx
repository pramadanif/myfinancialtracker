"use client";

import { useEffect, useState } from "react";
import { Settings2, Check, X } from "lucide-react";
import { cn, formatCurrencyShort } from "@/lib/utils";
import { loadAmountShortcuts, saveAmountShortcuts, DEFAULT_AMOUNT_SHORTCUTS } from "@/lib/amount-shortcuts";

interface AmountShortcutBarProps {
  amount: number;
  onSelect: (value: number) => void;
  className?: string;
}

export default function AmountShortcutBar({ amount, onSelect, className }: AmountShortcutBarProps) {
  const [shortcuts, setShortcuts] = useState<number[]>(DEFAULT_AMOUNT_SHORTCUTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    setShortcuts(loadAmountShortcuts());
  }, []);

  const openEdit = () => {
    const slots = [...shortcuts.map(String)];
    while (slots.length < 5) slots.push("");
    setDraft(slots.slice(0, 5));
    setEditing(true);
  };

  const saveEdit = () => {
    const parsed = draft
      .map((s) => parseInt(s.replace(/\D/g, ""), 10))
      .filter((n) => n > 0);
    const next = parsed.length > 0 ? parsed : DEFAULT_AMOUNT_SHORTCUTS;
    setShortcuts(next);
    saveAmountShortcuts(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
          Atur shortcut nominal
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {draft.map((val, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              value={val}
              placeholder="50000"
              onChange={(e) => {
                const next = [...draft];
                next[i] = e.target.value.replace(/\D/g, "");
                setDraft(next);
              }}
              className="h-9 px-2 rounded-lg border border-border-light text-xs font-semibold text-center tabular-nums"
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 h-8 rounded-lg border border-border-light text-xs font-semibold text-text-secondary flex items-center justify-center gap-1"
          >
            <X size={14} /> Batal
          </button>
          <button
            type="button"
            onClick={saveEdit}
            className="flex-1 h-8 rounded-lg bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1"
          >
            <Check size={14} /> Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1.5 overflow-x-auto no-scrollbar", className)}>
      {shortcuts.map((val) => (
        <button
          key={val}
          type="button"
          onClick={() => onSelect(val)}
          className={cn(
            "shrink-0 px-3 h-8 rounded-full text-xs font-bold border transition-all",
            amount === val
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-secondary border-border-light active:bg-primary-50"
          )}
        >
          {formatCurrencyShort(val)}
        </button>
      ))}
      <button
        type="button"
        onClick={openEdit}
        className="shrink-0 w-8 h-8 rounded-full border border-border-light bg-white flex items-center justify-center text-text-tertiary"
        aria-label="Atur shortcut"
      >
        <Settings2 size={14} />
      </button>
    </div>
  );
}

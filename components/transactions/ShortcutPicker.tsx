"use client";

import { useRef, useState } from "react";
import { Zap } from "lucide-react";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import DynamicIcon from "@/components/ui/DynamicIcon";
import type { QuickShortcutWithRelations } from "@/types";

interface ShortcutPickerProps {
  shortcuts: QuickShortcutWithRelations[];
  onSelect: (shortcut: QuickShortcutWithRelations) => void;
  onInstantSave?: (shortcut: QuickShortcutWithRelations) => void;
  loadingId?: string | null;
}

const LONG_PRESS_MS = 450;

export default function ShortcutPicker({
  shortcuts,
  onSelect,
  onInstantSave,
  loadingId,
}: ShortcutPickerProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {shortcuts.map((s) => (
        <ShortcutCard
          key={s.id}
          shortcut={s}
          isLoading={loadingId === s.id}
          disabled={!!loadingId}
          onSelect={() => onSelect(s)}
          onInstantSave={onInstantSave && s.defaultAmount ? () => onInstantSave(s) : undefined}
        />
      ))}
    </div>
  );
}

function ShortcutCard({
  shortcut,
  isLoading,
  disabled,
  onSelect,
  onInstantSave,
}: {
  shortcut: QuickShortcutWithRelations;
  isLoading: boolean;
  disabled: boolean;
  onSelect: () => void;
  onInstantSave?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  };

  const startLongPress = () => {
    if (!onInstantSave) return;
    longPressedRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setPressing(false);
      onInstantSave();
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={(e) => {
        if (!onInstantSave) return;
        e.preventDefault();
        onInstantSave();
      }}
      onTouchStart={startLongPress}
      onTouchEnd={clearTimer}
      onTouchCancel={clearTimer}
      onMouseDown={startLongPress}
      onMouseUp={clearTimer}
      onMouseLeave={clearTimer}
      disabled={disabled}
      className="flex flex-col items-start p-3.5 rounded-2xl bg-white border-2 border-border-light
                 hover:border-primary hover:bg-primary-50 active:scale-[0.97]
                 transition-all duration-150 text-left min-h-[96px] relative select-none"
    >
      {(isLoading || pressing) && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl z-10">
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          ) : (
            <span className="text-xs font-bold text-primary">Tahan...</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
          <DynamicIcon
            name={shortcut.iconName || shortcut.category.iconName}
            size="md"
            className="text-primary"
          />
        </div>
        {shortcut.defaultAmount ? (
          <span className="text-2xs font-bold text-primary bg-primary-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <Zap size={10} strokeWidth={2.5} />
            1-tap
          </span>
        ) : null}
      </div>
      <span className="text-sm font-bold text-text-primary leading-tight line-clamp-2">
        {shortcut.label}
      </span>
      <span className="text-xs font-semibold text-primary mt-1 tabular-nums">
        {shortcut.defaultAmount ? formatCurrencyShort(shortcut.defaultAmount) : "Atur nominal →"}
      </span>
      <span className="text-2xs text-text-tertiary mt-0.5">{shortcut.account.name}</span>
    </button>
  );
}

interface ShortcutConfirmProps {
  shortcut: QuickShortcutWithRelations;
  amount: number;
  onAmountChange: (amount: number) => void;
  onSave: () => void;
  onEditFull: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
}

export function ShortcutConfirm({
  shortcut,
  amount,
  onAmountChange,
  onSave,
  onEditFull,
  onBack,
  loading,
  error,
}: ShortcutConfirmProps) {
  const [editingAmount, setEditingAmount] = useState(false);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-primary font-medium">
        ← Kembali
      </button>

      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
          <DynamicIcon
            name={shortcut.iconName || shortcut.category.iconName}
            size="lg"
            className="text-primary"
          />
        </div>
        <p className="text-lg font-bold text-text-primary">{shortcut.label}</p>
        <p className="text-xs text-text-tertiary mt-1">
          {shortcut.account.name} · {shortcut.category.name}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEditingAmount((v) => !v)}
        className="w-full py-4 rounded-2xl bg-background-secondary border border-border-light text-center active:bg-background-tertiary transition-colors"
      >
        <p className="text-2xs text-text-tertiary uppercase tracking-wide font-semibold mb-1">
          {editingAmount ? "Ketuk selesai setelah ubah" : "Ketuk untuk ubah nominal"}
        </p>
        <p className="text-3xl font-bold text-text-primary tabular-nums">
          {amount > 0 ? formatCurrency(amount) : "Rp0"}
        </p>
      </button>

      {editingAmount && (
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === "back") {
                  onAmountChange(parseInt(String(amount).slice(0, -1), 10) || 0);
                } else if (key === "00") {
                  const next = amount * 100;
                  if (next <= 999999999) onAmountChange(next);
                } else {
                  const next = parseInt(`${amount}${key}`, 10);
                  if (next <= 999999999) onAmountChange(next);
                }
              }}
              className="h-12 rounded-xl bg-white border border-border-light text-lg font-semibold active:bg-primary-50 transition-colors"
            >
              {key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-status-danger text-center font-medium">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={loading || amount <= 0}
        className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-button
                   hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : `Simpan ${amount > 0 ? formatCurrencyShort(amount) : ""}`}
      </button>

      <button type="button" onClick={onEditFull} className="w-full py-3 text-sm text-text-secondary font-medium">
        Ubah detail lengkap
      </button>
    </div>
  );
}

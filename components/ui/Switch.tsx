"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-border",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "block h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)]",
          "transition-transform duration-200 ease-out",
          checked ? "translate-x-[1.375rem]" : "translate-x-0"
        )}
      />
    </button>
  );
}

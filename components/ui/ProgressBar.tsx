import { cn, getBudgetStatusHex } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValues?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showValues = true,
  formatValue,
  className,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const displayPct = max > 0 ? (value / max) * 100 : 0;
  const color = getBudgetStatusHex(displayPct);

  const fmt = formatValue || ((v: number) => v.toLocaleString("id-ID"));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-2.5">
          {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
          {showValues && (
            <span className="text-xs text-text-tertiary tabular-nums">
              Rp{fmt(value)} <span className="text-text-tertiary/60">/ Rp{fmt(max)}</span>
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      {max > 0 && (
        <p className="text-2xs text-text-tertiary mt-1.5 text-right tabular-nums">
          {Math.round(displayPct)}% terpakai
        </p>
      )}
    </div>
  );
}

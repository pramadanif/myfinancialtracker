"use client";

import { cn } from "@/lib/utils";

interface TransactionModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function TransactionModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  className,
}: TransactionModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-lg bg-white rounded-t-[1.35rem] max-h-[94vh] flex flex-col shadow-sheet animate-slide-up",
          className
        )}
      >
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-border-light" />
        </div>

        <div className="shrink-0 px-5 pt-1 pb-3 border-b border-border-light/80 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-primary leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-text-tertiary hover:text-text-secondary shrink-0"
            aria-label="Tutup"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border-light bg-white/95 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}

export function LedgerSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="surface-card p-4 space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-8 w-16" />
            <div className="skeleton h-6 w-24" />
          </div>
          {[1, 2].map((j) => (
            <div key={j} className="flex gap-3 items-center">
              <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

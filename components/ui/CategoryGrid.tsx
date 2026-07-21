"use client";

import { cn } from "@/lib/utils";
import DynamicIcon from "@/components/ui/DynamicIcon";
import type { Category } from "@prisma/client";

interface CategoryGridProps {
  categories: (Category & { usageCount?: number })[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  const sorted = [...categories].sort(
    (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
  );

  return (
    <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
      {sorted.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[80px] gap-1.5",
            selectedId === cat.id
              ? "bg-primary-light border-primary"
              : "bg-white border-border hover:border-primary/50"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              selectedId === cat.id ? "bg-primary" : "bg-primary-light"
            )}
          >
            <DynamicIcon
              name={cat.iconName}
              size="md"
              color={selectedId === cat.id ? "#FFFFFF" : "#0055A4"}
            />
          </div>
          <span className="text-[10px] text-text-primary font-medium text-center leading-tight line-clamp-2">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}

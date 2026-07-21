import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <h2 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-0.5 text-xs font-medium text-primary"
        >
          {action.label}
          <ChevronRight size={14} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

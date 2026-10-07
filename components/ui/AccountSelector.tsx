"use client";

import { cn } from "@/lib/utils";
import { AccountIconBox } from "@/components/ui/DynamicIcon";
import type { Account } from "@prisma/client";

interface AccountSelectorProps {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function AccountSelector({ accounts, selectedId, onSelect }: AccountSelectorProps) {
  return (
    <div className={cn("grid gap-2", accounts.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSelect(account.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl font-semibold transition-all border-2 min-w-0",
            accounts.length === 4 ? "text-xs" : "text-sm",
            selectedId === account.id
              ? "bg-primary text-white border-primary shadow-button"
              : "bg-white text-text-primary border-border hover:border-primary"
          )}
        >
          <AccountIconBox
            accountName={account.name}
            colorTag={selectedId === account.id ? "#FFFFFF" : account.colorTag}
            size="sm"
          />
          <span className="truncate max-w-full">{account.name}</span>
        </button>
      ))}
    </div>
  );
}

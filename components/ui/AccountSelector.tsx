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
    <div className="grid grid-cols-3 gap-2">
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSelect(account.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl font-semibold text-sm transition-all border-2",
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
          <span>{account.name}</span>
        </button>
      ))}
    </div>
  );
}

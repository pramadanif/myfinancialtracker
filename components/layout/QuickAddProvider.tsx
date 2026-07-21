"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import QuickAddModal from "@/components/transactions/QuickAddModal";

interface QuickAddContextValue {
  openQuickAdd: (defaultDate?: string) => void;
  closeQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const openQuickAdd = useCallback((date?: string) => {
    setDefaultDate(date);
    setIsOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsOpen(false);
    setDefaultDate(undefined);
  }, []);

  return (
    <QuickAddContext.Provider value={{ openQuickAdd, closeQuickAdd }}>
      {children}
      <QuickAddModal isOpen={isOpen} onClose={closeQuickAdd} defaultDate={defaultDate} />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface DataRefreshContextValue {
  version: number;
  notifyDataChange: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const notifyDataChange = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return (
    <DataRefreshContext.Provider value={{ version, notifyDataChange }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) throw new Error("useDataRefresh must be used within DataRefreshProvider");
  return ctx;
}

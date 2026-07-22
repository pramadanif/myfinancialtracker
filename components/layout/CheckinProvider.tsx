"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { AppSettingsData } from "@/types";

interface CheckinContextValue {
  checkinModeActive: boolean;
  checkinStartedAt: string | null;
  loading: boolean;
  toggleCheckinMode: () => Promise<void>;
  setCheckinMode: (active: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const CheckinContext = createContext<CheckinContextValue | null>(null);

export function CheckinProvider({ children }: { children: ReactNode }) {
  const { notifyDataChange } = useDataRefresh();
  const [settings, setSettings] = useState<AppSettingsData>({
    weeklyGeneralBudget: null,
    checkinModeActive: false,
    checkinStartedAt: null,
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const setCheckinMode = useCallback(async (active: boolean) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkinModeActive: active }),
    });
    if (res.ok) {
      setSettings(await res.json());
      notifyDataChange();
    }
  }, [notifyDataChange]);

  const toggleCheckinMode = useCallback(async () => {
    await setCheckinMode(!settings.checkinModeActive);
  }, [setCheckinMode, settings.checkinModeActive]);

  return (
    <CheckinContext.Provider
      value={{
        checkinModeActive: settings.checkinModeActive,
        checkinStartedAt: settings.checkinStartedAt,
        loading,
        toggleCheckinMode,
        setCheckinMode,
        refreshSettings,
      }}
    >
      {children}
    </CheckinContext.Provider>
  );
}

export function useCheckinMode() {
  const ctx = useContext(CheckinContext);
  if (!ctx) throw new Error("useCheckinMode must be used within CheckinProvider");
  return ctx;
}

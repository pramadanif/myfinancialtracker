"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { AppSettingsData } from "@/types";

interface ActivityModeContextValue {
  checkinModeActive: boolean;
  checkinStartedAt: string | null;
  pacaranModeActive: boolean;
  pacaranStartedAt: string | null;
  loading: boolean;
  toggleCheckinMode: () => Promise<void>;
  togglePacaranMode: () => Promise<void>;
  setCheckinMode: (active: boolean) => Promise<void>;
  setPacaranMode: (active: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const ActivityModeContext = createContext<ActivityModeContextValue | null>(null);

const defaultSettings: AppSettingsData = {
  weeklyGeneralBudget: null,
  checkinModeActive: false,
  checkinStartedAt: null,
  pacaranModeActive: false,
  pacaranStartedAt: null,
};

export function CheckinProvider({ children }: { children: ReactNode }) {
  const { notifyDataChange } = useDataRefresh();
  const [settings, setSettings] = useState<AppSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateMode = useCallback(async (body: Record<string, boolean>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSettings(await res.json());
      notifyDataChange();
    }
  }, [notifyDataChange]);

  const setCheckinMode = useCallback((active: boolean) => updateMode({ checkinModeActive: active }), [updateMode]);
  const setPacaranMode = useCallback((active: boolean) => updateMode({ pacaranModeActive: active }), [updateMode]);
  const toggleCheckinMode = useCallback(async () => {
    await setCheckinMode(!settings.checkinModeActive);
  }, [setCheckinMode, settings.checkinModeActive]);
  const togglePacaranMode = useCallback(async () => {
    await setPacaranMode(!settings.pacaranModeActive);
  }, [setPacaranMode, settings.pacaranModeActive]);

  return (
    <ActivityModeContext.Provider
      value={{
        checkinModeActive: settings.checkinModeActive,
        checkinStartedAt: settings.checkinStartedAt,
        pacaranModeActive: settings.pacaranModeActive,
        pacaranStartedAt: settings.pacaranStartedAt,
        loading,
        toggleCheckinMode,
        togglePacaranMode,
        setCheckinMode,
        setPacaranMode,
        refreshSettings,
      }}
    >
      {children}
    </ActivityModeContext.Provider>
  );
}

function useActivityModes() {
  const ctx = useContext(ActivityModeContext);
  if (!ctx) throw new Error("useActivityModes must be used within CheckinProvider");
  return ctx;
}

export function useCheckinMode() {
  const ctx = useActivityModes();
  return {
    checkinModeActive: ctx.checkinModeActive,
    checkinStartedAt: ctx.checkinStartedAt,
    loading: ctx.loading,
    toggleCheckinMode: ctx.toggleCheckinMode,
    setCheckinMode: ctx.setCheckinMode,
    refreshSettings: ctx.refreshSettings,
  };
}

export function usePacaranMode() {
  const ctx = useActivityModes();
  return {
    pacaranModeActive: ctx.pacaranModeActive,
    pacaranStartedAt: ctx.pacaranStartedAt,
    loading: ctx.loading,
    togglePacaranMode: ctx.togglePacaranMode,
    setPacaranMode: ctx.setPacaranMode,
    refreshSettings: ctx.refreshSettings,
  };
}

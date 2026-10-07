"use client";

import { useEffect } from "react";

const IDLE_LOCK_MS = 10 * 60 * 1000;
const PING_INTERVAL_MS = 2 * 60 * 1000;
const HIDDEN_AT_KEY = "finance-hidden-at";

function lock() {
  window.location.replace("/login");
}

async function ping() {
  try {
    const res = await fetch("/api/auth/ping", { cache: "no-store" });
    if (res.status === 401) lock();
  } catch {
    /* offline */
  }
}

export default function IdleLock() {
  useEffect(() => {
    const hiddenAt = Number(localStorage.getItem(HIDDEN_AT_KEY) || 0);
    if (hiddenAt && Date.now() - hiddenAt > IDLE_LOCK_MS) {
      localStorage.removeItem(HIDDEN_AT_KEY);
      lock();
      return;
    }
    localStorage.removeItem(HIDDEN_AT_KEY);

    let timer: ReturnType<typeof setInterval> | null = setInterval(ping, PING_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
        if (timer) clearInterval(timer);
        timer = null;
        return;
      }
      const since = Number(localStorage.getItem(HIDDEN_AT_KEY) || 0);
      localStorage.removeItem(HIDDEN_AT_KEY);
      if (since && Date.now() - since > IDLE_LOCK_MS) {
        lock();
        return;
      }
      ping();
      timer = setInterval(ping, PING_INTERVAL_MS);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}

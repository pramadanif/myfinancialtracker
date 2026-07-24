"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, ChevronDown, ChevronUp } from "lucide-react";
import Switch from "@/components/ui/Switch";
import { canRequestPushPermission, isStandalone, urlBase64ToUint8Array } from "@/lib/pwa";

interface Preferences {
  dailyReminder: boolean;
  dailyReminderHour: number;
  budgetAlert: boolean;
  weeklySummary: boolean;
  weeklySummaryHour: number;
  hasSubscription: boolean;
}

export default function NotificationSettings() {
  const [mounted, setMounted] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadPrefs = useCallback(async () => {
    const res = await fetch("/api/push/preferences");
    if (res.ok) setPrefs(await res.json());
  }, []);

  useEffect(() => {
    setStandalone(isStandalone());
    if ("Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
    loadPrefs();
    setMounted(true);
  }, [loadPrefs]);

  const subscribe = async () => {
    setLoading(true);
    setMessage("");
    try {
      const keyRes = await fetch("/api/push/subscribe");
      if (!keyRes.ok) {
        const err = await keyRes.json().catch(() => ({}));
        throw new Error(err.error || "Push belum dikonfigurasi di server");
      }
      const { publicKey } = await keyRes.json();

      if (!("serviceWorker" in navigator)) {
        throw new Error("Browser tidak mendukung service worker");
      }

      let registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      }
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        throw new Error("Izin notifikasi ditolak. Aktifkan di Pengaturan iPhone.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!saveRes.ok) {
        throw new Error("Gagal menyimpan subscription ke server");
      }

      await loadPrefs();
      setMessage("Notifikasi aktif!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengirim test");
      setMessage(
        data.sent > 0
          ? `Test terkirim ke ${data.sent} perangkat`
          : "Tidak ada perangkat yang menerima push"
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengirim test");
    } finally {
      setLoading(false);
    }
  };

  const updatePref = async (key: string, value: boolean | number) => {
    const res = await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) setPrefs(await res.json());
  };

  if (!mounted) {
    return (
      <div className="surface-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Notifikasi</p>
            <p className="text-xs text-text-secondary">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!standalone) {
    return (
      <div className="surface-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Notifikasi Push</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Install app ke Home Screen dulu, lalu buka dari icon tersebut untuk mengaktifkan notifikasi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            {permission === "granted" ? (
              <Bell size={20} className="text-primary" />
            ) : (
              <BellOff size={20} className="text-text-tertiary" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Notifikasi</p>
            <p className="text-xs text-text-secondary">
              {permission === "granted" ? "Aktif" : "Belum diaktifkan"}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-text-tertiary" /> : <ChevronDown size={18} className="text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-light pt-3">
          {permission !== "granted" && (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
              Notifikasi hanya bisa diaktifkan saat app dibuka dari Home Screen (bukan tab Safari).
            </div>
          )}

          {canRequestPushPermission() && permission !== "granted" && (
            <button
              type="button"
              onClick={subscribe}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
            >
              {loading ? "Mengaktifkan..." : "Aktifkan Notifikasi"}
            </button>
          )}

          {message && <p className="text-xs text-center text-primary font-medium">{message}</p>}

          {prefs && permission === "granted" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={sendTest}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-primary disabled:opacity-50"
              >
                Kirim notifikasi test
              </button>
              <div className="rounded-xl border border-border-light divide-y divide-border-light overflow-hidden bg-white">
                <ToggleRow
                  label="Reminder harian"
                  sublabel={`Jam ${prefs.dailyReminderHour}:00 WIB — jika belum input transaksi`}
                  checked={prefs.dailyReminder}
                  onChange={(v) => updatePref("dailyReminder", v)}
                />
                <ToggleRow
                  label="Alert budget 90%"
                  sublabel="Mingguan & bulanan saat hampir melewati batas"
                  checked={prefs.budgetAlert}
                  onChange={(v) => updatePref("budgetAlert", v)}
                />
                <ToggleRow
                  label="Ringkasan mingguan"
                  sublabel={`Senin jam ${prefs.weeklySummaryHour}:00 WIB`}
                  checked={prefs.weeklySummary}
                  onChange={(v) => updatePref("weeklySummary", v)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-3">
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm font-semibold text-text-primary leading-snug">{label}</p>
        <p className="text-2xs text-text-tertiary mt-0.5 leading-relaxed">{sublabel}</p>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

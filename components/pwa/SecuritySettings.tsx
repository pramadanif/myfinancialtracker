"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanFace, Trash2 } from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

interface Passkey {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function guessDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  return "Perangkat";
}

export default function SecuritySettings() {
  const [supported, setSupported] = useState(true);
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/passkey", { cache: "no-store" });
    if (res.ok) setPasskeys(await res.json());
  }, []);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    load();
  }, [load]);

  const enable = async () => {
    setLoading(true);
    setMessage("");
    try {
      const optionsRes = await fetch("/api/auth/passkey/register/options", { method: "POST" });
      if (!optionsRes.ok) throw new Error("Gagal memulai pendaftaran");
      const optionsJSON = await optionsRes.json();
      const response = await startRegistration({ optionsJSON });
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, deviceName: guessDeviceName() }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).error || "Verifikasi gagal");
      setMessage("Face ID aktif. Dipakai saat app terkunci.");
      load();
    } catch (err) {
      const cancelled = err instanceof Error && err.name === "NotAllowedError";
      setMessage(cancelled ? "Dibatalkan." : err instanceof Error ? err.message : "Gagal mengaktifkan Face ID");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus Face ID dari perangkat ini?")) return;
    await fetch(`/api/auth/passkey?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  const active = (passkeys?.length ?? 0) > 0;

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <ScanFace size={20} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary">Face ID & Kunci Otomatis</p>
          <p className="text-xs text-text-secondary">
            Terkunci 10 menit setelah keluar app{active ? " · Face ID aktif" : ""}
          </p>
        </div>
      </div>

      {passkeys && passkeys.length > 0 && (
        <ul className="space-y-1.5">
          {passkeys.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border-light px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary">{p.deviceName || "Perangkat"}</p>
                <p className="text-2xs text-text-tertiary">
                  Ditambahkan {new Date(p.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="p-1.5 text-text-tertiary hover:text-status-danger"
                aria-label="Hapus Face ID"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <button
          type="button"
          onClick={enable}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:opacity-80 disabled:opacity-50"
        >
          {loading ? "Menunggu Face ID..." : active ? "Tambah perangkat lain" : "Aktifkan Face ID"}
        </button>
      ) : (
        <p className="text-xs text-text-secondary">Browser ini tidak mendukung Face ID / passkey.</p>
      )}

      {message && <p className="text-xs text-text-secondary text-center">{message}</p>}
    </div>
  );
}

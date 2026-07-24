"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import AppLogo from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const submitPin = useCallback(async (value: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });

      if (res.ok) {
        router.push("/transactions");
        router.refresh();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
        setError("PIN salah. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi Anda.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDigit = (digit: string) => {
    if (loading || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === PIN_LENGTH) {
      submitPin(next);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen flex flex-col bg-white safe-area-top safe-area-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <AppLogo size={80} className="mx-auto mb-5" />
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Finance Tracker</h1>
            <p className="text-sm text-text-secondary mt-2">Masukkan PIN untuk melanjutkan</p>
          </div>

          {/* PIN dots */}
          <div
            className={cn(
              "flex justify-center gap-3 mb-8",
              shake && "animate-shake"
            )}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 transition-all duration-150",
                  i < pin.length
                    ? "bg-primary border-primary scale-110"
                    : "bg-transparent border-border",
                  error && i < pin.length && "bg-status-danger border-status-danger"
                )}
              />
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-status-danger-light border border-status-danger/20">
              <p className="text-sm text-status-danger text-center font-medium">{error}</p>
            </div>
          )}

          {loading && (
            <p className="text-center text-sm text-text-secondary mb-5">Memverifikasi...</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {keys.map((key, i) => {
              if (key === "") {
                return <div key={i} />;
              }
              if (key === "del") {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={handleBackspace}
                    disabled={loading || pin.length === 0}
                    className="h-16 flex items-center justify-center rounded-2xl text-text-secondary active:bg-background-secondary transition-colors disabled:opacity-30"
                    aria-label="Hapus"
                  >
                    <Delete size={22} strokeWidth={1.75} />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDigit(key)}
                  disabled={loading}
                  className="h-16 rounded-2xl bg-background-secondary text-xl font-semibold text-text-primary active:bg-primary-50 active:text-primary transition-colors disabled:opacity-50"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-2xs text-text-tertiary pb-6">
        Sesi aktif 3 bulan · Data tersimpan aman
      </p>
    </div>
  );
}

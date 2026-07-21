"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Password salah. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white safe-area-top safe-area-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-button">
              <Wallet size={36} color="#FFFFFF" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Finance Tracker</h1>
            <p className="text-sm text-text-secondary mt-2">Kelola keuangan pribadi Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3.5 top-[2.6rem] text-text-tertiary pointer-events-none">
                <Lock size={16} strokeWidth={2} />
              </div>
              <Input
                type="password"
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-status-danger-light border border-status-danger/20">
                <p className="text-sm text-status-danger text-center font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading || !password} className="mt-2">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>

      <p className="text-center text-2xs text-text-tertiary pb-6">
        Data tersimpan aman di perangkat Anda
      </p>
    </div>
  );
}

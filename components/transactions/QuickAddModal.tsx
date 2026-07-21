"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, PenLine } from "lucide-react";
import Button from "@/components/ui/Button";
import Numpad from "@/components/ui/Numpad";
import AccountSelector from "@/components/ui/AccountSelector";
import CategoryGrid from "@/components/ui/CategoryGrid";
import Input from "@/components/ui/Input";
import ShortcutPicker, { ShortcutConfirm } from "@/components/transactions/ShortcutPicker";
import { cn, formatCurrency } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import type { Account, Category } from "@prisma/client";
import type { QuickShortcutWithRelations } from "@/types";

type TabType = "expense" | "income" | "transfer";
type ViewMode = "shortcuts" | "confirm" | "manual";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export default function QuickAddModal({ isOpen, onClose, defaultDate }: QuickAddModalProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("shortcuts");
  const [tab, setTab] = useState<TabType>("expense");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<(Category & { usageCount?: number })[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<(Category & { usageCount?: number })[]>([]);
  const [shortcuts, setShortcuts] = useState<QuickShortcutWithRelations[]>([]);

  const [selectedShortcut, setSelectedShortcut] = useState<QuickShortcutWithRelations | null>(null);
  const [accountId, setAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || toISODateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [savingShortcutId, setSavingShortcutId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/quick-add-data");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts);
      setExpenseCategories(data.expenseCategories);
      setIncomeCategories(data.incomeCategories);
      setShortcuts(data.shortcuts);
      if (data.accounts.length > 0) {
        setAccountId((prev) => prev || data.accounts[0].id);
        setFromAccountId((prev) => prev || data.accounts[0].id);
        if (data.accounts.length > 1) {
          setToAccountId((prev) => prev || data.accounts[1].id);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (defaultDate) setDate(defaultDate);
      setShowTransferConfirm(false);
      setShowSuccess(false);
      setError("");
      setSelectedShortcut(null);
      setView("shortcuts");
      setTab("expense");
    }
  }, [isOpen, defaultDate, fetchData]);

  const applyShortcutToForm = (shortcut: QuickShortcutWithRelations) => {
    setAccountId(shortcut.accountId);
    setCategoryId(shortcut.categoryId);
    setAmount(shortcut.defaultAmount || 0);
    setDescription(shortcut.label);
    setTab("expense");
  };

  const handleShortcutSelect = async (shortcut: QuickShortcutWithRelations) => {
    setSelectedShortcut(shortcut);
    setAmount(shortcut.defaultAmount || 0);
    setError("");

    // Shortcut dengan nominal default → langsung ke konfirmasi cepat
    if (shortcut.defaultAmount && shortcut.defaultAmount > 0) {
      setView("confirm");
      return;
    }

    // Tanpa nominal → buka konfirmasi dengan numpad
    setView("confirm");
  };

  const handleShortcutSave = async () => {
    if (!selectedShortcut || amount <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedShortcut.accountId,
          categoryId: selectedShortcut.categoryId,
          amount,
          type: "DEBIT",
          description: selectedShortcut.label,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }

      await fetch(`/api/shortcuts/${selectedShortcut.id}/use`, { method: "POST" });

      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
        router.refresh();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantSave = async (shortcut: QuickShortcutWithRelations) => {
    if (!shortcut.defaultAmount || shortcut.defaultAmount <= 0) return;

    setSavingShortcutId(shortcut.id);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: shortcut.accountId,
          categoryId: shortcut.categoryId,
          amount: shortcut.defaultAmount,
          type: "DEBIT",
          description: shortcut.label,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }

      await fetch(`/api/shortcuts/${shortcut.id}/use`, { method: "POST" });

      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      // Fallback ke confirm view jika instant save gagal
      setSelectedShortcut(shortcut);
      setAmount(shortcut.defaultAmount || 0);
      setView("confirm");
    } finally {
      setSavingShortcutId(null);
    }
  };

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const handleSave = async () => {
    setError("");

    if (amount <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    if (tab === "transfer") {
      if (fromAccountId === toAccountId) {
        setError("Akun asal dan tujuan tidak boleh sama");
        return;
      }
      if (!showTransferConfirm) {
        setShowTransferConfirm(true);
        return;
      }
    } else if (!categoryId) {
      setError("Kategori wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (tab === "transfer") {
        const res = await fetch("/api/transactions/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromAccountId, toAccountId, amount, description, date }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal menyimpan transfer");
        }
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            categoryId,
            amount,
            type: tab === "expense" ? "DEBIT" : "CREDIT",
            description,
            date,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal menyimpan transaksi");
        }
      }

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(0);
    setDescription("");
    setCategoryId("");
    setSelectedShortcut(null);
    setDate(toISODateString(new Date()));
    setError("");
    setShowTransferConfirm(false);
    setShowSuccess(false);
    setView("shortcuts");
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(toISODateString(yesterday));
  };

  if (!isOpen) return null;

  const categories = tab === "income" ? incomeCategories : expenseCategories;
  const expenseShortcuts = shortcuts.filter(
    (s) => s.category.type !== "INCOME" && s.category.type !== "TRANSFER"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-sheet animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-status-safe/15 flex items-center justify-center mb-4">
              <span className="text-3xl text-status-safe">✓</span>
            </div>
            <p className="text-lg font-bold text-text-primary">Tersimpan!</p>
            <p className="text-sm text-text-secondary mt-1">Saldo telah diperbarui</p>
          </div>
        ) : (
          <>
            <div className="sticky top-5 bg-white border-b border-border-light px-5 py-3 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-text-primary">
                {view === "shortcuts" && "Tambah Cepat"}
                {view === "confirm" && "Konfirmasi"}
                {view === "manual" && "Input Manual"}
              </h2>
              <button type="button" onClick={onClose} className="icon-btn w-8 h-8">
                <span className="text-xl leading-none text-text-tertiary">×</span>
              </button>
            </div>

            <div className="p-5 space-y-4 pb-10">
              {/* ── SHORTCUT PICKER (default) ── */}
              {view === "shortcuts" && (
                <>
                  {expenseShortcuts.length > 0 ? (
                    <>
                      <p className="text-xs text-text-secondary text-center">
                        Ketuk untuk konfirmasi · tahan untuk simpan langsung (shortcut dengan nominal)
                      </p>
                      <ShortcutPicker
                        shortcuts={expenseShortcuts}
                        onSelect={handleShortcutSelect}
                        onInstantSave={handleInstantSave}
                        loadingId={savingShortcutId}
                      />

                      {error && <p className="text-sm text-status-danger text-center">{error}</p>}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="secondary"
                          fullWidth
                          onClick={() => setView("manual")}
                          className="flex items-center justify-center gap-2"
                        >
                          <PenLine size={16} />
                          Input Manual
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => { setView("manual"); setTab("transfer"); }}
                          className="flex items-center justify-center gap-2"
                        >
                          <ArrowLeftRight size={16} />
                          Transfer
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-text-secondary mb-4">Belum ada shortcut. Buat di tab Transaksi → Shortcut.</p>
                      <Button fullWidth onClick={() => setView("manual")}>Input Manual</Button>
                    </div>
                  )}
                </>
              )}

              {/* ── SHORTCUT CONFIRM ── */}
              {view === "confirm" && selectedShortcut && (
                <ShortcutConfirm
                  shortcut={selectedShortcut}
                  amount={amount}
                  onAmountChange={setAmount}
                  onSave={handleShortcutSave}
                  onEditFull={() => {
                    applyShortcutToForm(selectedShortcut);
                    setView("manual");
                  }}
                  onBack={() => { setView("shortcuts"); setSelectedShortcut(null); setError(""); }}
                  loading={loading}
                  error={error}
                />
              )}

              {/* ── MANUAL FORM ── */}
              {view === "manual" && (
                <>
                  {expenseShortcuts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setView("shortcuts")}
                      className="text-sm text-primary font-medium"
                    >
                      ← Kembali ke shortcut
                    </button>
                  )}

                  <div className="flex rounded-2xl bg-background-secondary p-1 gap-0.5">
                    {(["expense", "income", "transfer"] as TabType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTab(t);
                          setCategoryId("");
                          setError("");
                          setShowTransferConfirm(false);
                        }}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                          tab === t ? "bg-primary text-white shadow-button" : "text-text-secondary"
                        )}
                      >
                        {t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
                      </button>
                    ))}
                  </div>

                  {showTransferConfirm && tab === "transfer" ? (
                    <div className="space-y-4">
                      <div className="bg-primary-50 rounded-2xl p-5 text-center">
                        <ArrowLeftRight className="mx-auto text-primary mb-2" size={32} strokeWidth={1.75} />
                        <p className="text-2xl font-bold text-text-primary tabular-nums">{formatCurrency(amount)}</p>
                        <p className="text-sm text-primary font-semibold mt-2">
                          {fromAccount?.name} → {toAccount?.name}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[fromAccount, toAccount].map((acc, i) => (
                          <div key={acc?.id} className="bg-background-secondary rounded-xl p-3">
                            <p className="text-2xs text-text-tertiary uppercase font-semibold">{acc?.name}</p>
                            <p className="text-xs text-text-secondary mt-1">Sebelum</p>
                            <p className="text-sm font-semibold tabular-nums">{formatCurrency(acc?.currentBalance || 0)}</p>
                            <p className="text-xs text-text-secondary mt-2">Sesudah</p>
                            <p className={cn("text-sm font-bold tabular-nums", i === 0 ? "text-status-danger" : "text-status-safe")}>
                              {formatCurrency(
                                i === 0
                                  ? (acc?.currentBalance || 0) - amount
                                  : (acc?.currentBalance || 0) + amount
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                      {error && <p className="text-sm text-status-danger text-center">{error}</p>}
                      <div className="flex gap-2">
                        <Button variant="secondary" fullWidth onClick={() => setShowTransferConfirm(false)}>Kembali</Button>
                        <Button fullWidth size="lg" onClick={handleSave} disabled={loading}>
                          {loading ? "Menyimpan..." : "Konfirmasi"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {tab === "transfer" ? (
                        <>
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Dari Akun</p>
                            <AccountSelector accounts={accounts} selectedId={fromAccountId} onSelect={setFromAccountId} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Ke Akun</p>
                            <AccountSelector accounts={accounts} selectedId={toAccountId} onSelect={setToAccountId} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Akun</p>
                            <AccountSelector accounts={accounts} selectedId={accountId} onSelect={setAccountId} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Kategori</p>
                            <CategoryGrid categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
                          </div>
                        </>
                      )}

                      <Numpad value={amount} onChange={setAmount} />

                      <Input
                        label="Deskripsi"
                        placeholder="Opsional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />

                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Tanggal</p>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-1 px-3.5 py-3 rounded-xl border border-border bg-white text-sm"
                          />
                          <Button variant="secondary" size="md" onClick={setYesterday} type="button">Kemarin</Button>
                        </div>
                      </div>

                      {error && <p className="text-sm text-status-danger text-center">{error}</p>}

                      <Button fullWidth size="lg" onClick={handleSave} disabled={loading}>
                        {loading ? "Menyimpan..." : tab === "transfer" ? "Lanjut" : "Simpan"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

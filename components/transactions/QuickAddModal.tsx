"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, PenLine, ChevronLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import ShortcutPicker, { ShortcutConfirm } from "@/components/transactions/ShortcutPicker";
import TransactionFormBody from "@/components/transactions/TransactionFormBody";
import TransferForm from "@/components/transactions/TransferForm";
import TransactionModalShell from "@/components/transactions/TransactionModalShell";
import { toISODateString } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { useCheckinMode } from "@/components/layout/CheckinProvider";
import type { Account, Category } from "@prisma/client";
import type { QuickShortcutWithRelations } from "@/types";

type TabType = "expense" | "income" | "transfer";
type ViewMode = "shortcuts" | "confirm" | "manual" | "transfer";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export default function QuickAddModal({ isOpen, onClose, defaultDate }: QuickAddModalProps) {
  const router = useRouter();
  const { version, notifyDataChange } = useDataRefresh();
  const { checkinModeActive } = useCheckinMode();
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
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/quick-add-data", { cache: "no-store" });
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
    if (!isOpen) return;
    fetchData();
  }, [isOpen, version, fetchData]);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultDate) setDate(defaultDate);
    setShowSuccess(false);
    setError("");
    setSelectedShortcut(null);
    setView("shortcuts");
    setTab("expense");
  }, [isOpen, defaultDate]);

  useEffect(() => {
    if (!selectedShortcut) return;
    const fresh = shortcuts.find((s) => s.id === selectedShortcut.id);
    if (!fresh) {
      setSelectedShortcut(null);
      if (view === "confirm") setView("shortcuts");
      return;
    }
    if (
      fresh.label !== selectedShortcut.label ||
      fresh.defaultAmount !== selectedShortcut.defaultAmount ||
      fresh.accountId !== selectedShortcut.accountId ||
      fresh.categoryId !== selectedShortcut.categoryId
    ) {
      setSelectedShortcut(fresh);
      setAmount(fresh.defaultAmount || 0);
    }
  }, [shortcuts, selectedShortcut, view]);

  const applyShortcutToForm = (shortcut: QuickShortcutWithRelations) => {
    setAccountId(shortcut.accountId);
    setCategoryId(shortcut.categoryId);
    setAmount(shortcut.defaultAmount || 0);
    setDescription(shortcut.label);
    setTab("expense");
  };

  const handleShortcutSelect = (shortcut: QuickShortcutWithRelations) => {
    setSelectedShortcut(shortcut);
    setAmount(shortcut.defaultAmount || 0);
    setError("");
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
        notifyDataChange();
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
        notifyDataChange();
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSelectedShortcut(shortcut);
      setAmount(shortcut.defaultAmount || 0);
      setView("confirm");
    } finally {
      setSavingShortcutId(null);
    }
  };

  const handleSave = async () => {
    setError("");
    if (amount <= 0) { setError("Nominal harus lebih dari 0"); return; }
    const isTransfer = view === "transfer" || tab === "transfer";
    if (isTransfer) {
      if (fromAccountId === toAccountId) { setError("Akun asal dan tujuan tidak boleh sama"); return; }
    } else if (!categoryId) {
      setError("Kategori wajib diisi");
      return;
    }
    setLoading(true);
    try {
      if (isTransfer) {
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
            accountId, categoryId, amount,
            type: tab === "expense" ? "DEBIT" : "CREDIT",
            description, date,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal menyimpan transaksi");
        }
      }
      resetForm();
      onClose();
      notifyDataChange();
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
    setShowSuccess(false);
    setView("shortcuts");
  };

  if (!isOpen) return null;

  const categories = tab === "income" ? incomeCategories : expenseCategories;
  const expenseShortcuts = shortcuts.filter(
    (s) => s.category.type !== "INCOME" && s.category.type !== "TRANSFER"
  );

  const titles: Record<ViewMode, string> = {
    shortcuts: "Tambah Cepat",
    confirm: "Konfirmasi",
    manual: "Input Manual",
    transfer: "Transfer",
  };

  const subtitles: Record<ViewMode, string | undefined> = {
    shortcuts: checkinModeActive ? "Mode check-in · pengeluaran tercatat" : "Pilih shortcut atau input manual",
    confirm: selectedShortcut?.label,
    manual: checkinModeActive ? "Mode check-in aktif" : "Catat transaksi baru",
    transfer: "Pindah saldo antar akun",
  };

  const transferFooter = (
    <Button fullWidth size="lg" onClick={handleSave} disabled={loading || amount <= 0 || fromAccountId === toAccountId}>
      {loading ? "Menyimpan..." : amount > 0 ? `Transfer ${formatCurrency(amount)}` : "Transfer"}
    </Button>
  );

  const manualFooter = (
    <Button fullWidth size="lg" onClick={handleSave} disabled={loading || amount <= 0}>
      {loading ? "Menyimpan..." : "Simpan Transaksi"}
    </Button>
  );

  return (
    <TransactionModalShell
      title={titles[view]}
      subtitle={subtitles[view]}
      onClose={onClose}
      footer={view === "transfer" ? transferFooter : view === "manual" ? manualFooter : undefined}
    >
      {showSuccess ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-status-safe/15 flex items-center justify-center mb-4 ring-4 ring-status-safe/10">
            <span className="text-3xl text-status-safe">✓</span>
          </div>
          <p className="text-lg font-bold text-text-primary">Tersimpan!</p>
          <p className="text-sm text-text-secondary mt-1">Saldo diperbarui</p>
        </div>
      ) : view === "shortcuts" ? (
        expenseShortcuts.length > 0 ? (
          <div className="space-y-4">
            <ShortcutPicker
              shortcuts={expenseShortcuts}
              onSelect={handleShortcutSelect}
              onInstantSave={handleInstantSave}
              loadingId={savingShortcutId}
            />
            {error && <p className="text-sm text-status-danger text-center font-medium">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setView("manual")} className="gap-2">
                <PenLine size={16} /> Manual
              </Button>
              <Button variant="outline" fullWidth onClick={() => { setView("transfer"); setAmount(0); setError(""); }} className="gap-2">
                <ArrowLeftRight size={16} /> Transfer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-text-secondary">Belum ada shortcut.</p>
            <Button fullWidth onClick={() => setView("manual")}>Input Manual</Button>
          </div>
        )
      ) : view === "confirm" && selectedShortcut ? (
        <ShortcutConfirm
          shortcut={selectedShortcut}
          amount={amount}
          onAmountChange={setAmount}
          onSave={handleShortcutSave}
          onEditFull={() => { applyShortcutToForm(selectedShortcut); setView("manual"); }}
          onBack={() => { setView("shortcuts"); setSelectedShortcut(null); setError(""); }}
          loading={loading}
          error={error}
        />
      ) : view === "transfer" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setView("shortcuts"); setError(""); }}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
          <TransferForm
            accounts={accounts}
            fromAccountId={fromAccountId}
            toAccountId={toAccountId}
            onFromAccountChange={setFromAccountId}
            onToAccountChange={setToAccountId}
            amount={amount}
            onAmountChange={setAmount}
            date={date}
            onDateChange={setDate}
            description={description}
            onDescriptionChange={setDescription}
            error={error}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {expenseShortcuts.length > 0 && (
            <button
              type="button"
              onClick={() => setView("shortcuts")}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              <ChevronLeft size={16} /> Shortcut
            </button>
          )}

          <TransactionFormBody
            tab={tab}
            onTabChange={(t) => { if (t === "transfer") { setView("transfer"); return; } setTab(t); setCategoryId(""); setError(""); }}
            date={date}
            onDateChange={setDate}
            accountId={accountId}
            onAccountChange={setAccountId}
            fromAccountId={fromAccountId}
            toAccountId={toAccountId}
            onFromAccountChange={setFromAccountId}
            onToAccountChange={setToAccountId}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            description={description}
            onDescriptionChange={setDescription}
            amount={amount}
            onAmountChange={setAmount}
            accounts={accounts}
            categories={categories}
          />
          {error && <p className="text-sm text-status-danger text-center font-medium">{error}</p>}
        </div>
      )}
    </TransactionModalShell>
  );
}

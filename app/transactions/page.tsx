"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import DynamicIcon from "@/components/ui/DynamicIcon";
import TransactionLedger, { computePeriodSummary } from "@/components/transactions/TransactionLedger";
import TransactionSummaryBar from "@/components/transactions/TransactionSummaryBar";
import ShortcutManager from "@/components/transactions/ShortcutManager";
import TransactionEditModal from "@/components/transactions/TransactionEditModal";
import { LedgerSkeleton } from "@/components/ui/LoadingState";
import { formatCurrencyLedger, cn } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { TransactionWithRelations, QuickShortcutWithRelations } from "@/types";
import type { Account, Category } from "@prisma/client";

type ViewTab = "daily" | "calendar" | "monthly" | "summary" | "shortcuts";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "daily", label: "Harian" },
  { id: "calendar", label: "Kalender" },
  { id: "monthly", label: "Bulanan" },
  { id: "summary", label: "Ringkasan" },
  { id: "shortcuts", label: "Shortcut" },
];

function TransactionsContent() {
  const router = useRouter();
  const { version, notifyDataChange } = useDataRefresh();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeView, setActiveView] = useState<ViewTab>("daily");
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shortcuts, setShortcuts] = useState<QuickShortcutWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filterAccount, setFilterAccount] = useState(searchParams.get("accountId") || "");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(null);

  const monthStart = toISODateString(startOfMonth(currentMonth));
  const monthEnd = toISODateString(endOfMonth(currentMonth));
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", limit: "500" });
    params.set("startDate", monthStart);
    params.set("endDate", monthEnd);
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterCategory) params.set("categoryId", filterCategory);
    if (search) params.set("search", search);

    const res = await fetch(`/api/transactions?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
    }
    setLoading(false);
  }, [monthStart, monthEnd, filterAccount, filterCategory, search]);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts", { cache: "no-store" });
    if (res.ok) setAccounts(await res.json());
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()).then(setCategories);
    fetch("/api/shortcuts", { cache: "no-store" }).then((r) => r.json()).then(setShortcuts);
  }, [fetchTransactions, fetchAccounts, version]);

  const summary = computePeriodSummary(transactions);
  const hasActiveFilters = !!(filterAccount || filterCategory || search);

  const filteredAccount = filterAccount ? accounts.find((a) => a.id === filterAccount) : null;
  const accountBalance = filteredAccount
    ? filteredAccount.currentBalance
    : accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const accountLabel = filteredAccount?.name ?? (accounts.length > 1 ? "Semua akun" : accounts[0]?.name);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTransactions();
      fetchAccounts();
      notifyDataChange();
      router.refresh();
    }
  };

  const handleEditSaved = () => {
    fetchTransactions();
    fetchAccounts();
    notifyDataChange();
    router.refresh();
  };

  const refreshShortcuts = () => {
    notifyDataChange();
  };

  const categoryTotals = transactions
    .filter((t) => t.type === "DEBIT" && t.category)
    .reduce((acc, t) => {
      const name = t.category!.name;
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="page-container">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md safe-area-top shadow-sm">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border-light/80">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn("icon-btn", showFilters && "text-primary bg-primary-50")}
            aria-label="Filter"
          >
            <SlidersHorizontal size={18} strokeWidth={2} />
          </button>
          <h1 className="text-base font-bold text-text-primary">Transaksi</h1>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn("icon-btn", search && "text-primary bg-primary-50")}
            aria-label="Cari"
          >
            <Search size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Month picker */}
        <div className="flex items-center justify-center gap-1 py-2 px-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="icon-btn shrink-0"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => !isCurrentMonth && setCurrentMonth(new Date())}
            className={cn(
              "flex-1 max-w-[200px] py-2 px-3 rounded-xl bg-background-secondary border border-border-light transition-colors",
              !isCurrentMonth && "active:bg-primary-50"
            )}
          >
            <span className="text-sm font-bold text-text-primary capitalize block">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </span>
            {!isCurrentMonth && (
              <span className="block text-2xs text-primary font-medium mt-0.5">Tap untuk bulan ini</span>
            )}
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="icon-btn"
            disabled={isCurrentMonth}
          >
            <ChevronRight size={20} strokeWidth={2} className={isCurrentMonth ? "opacity-30" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 pb-2">
          <div className="flex overflow-x-auto scrollbar-hide rounded-xl bg-background-secondary p-1 gap-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "calendar") { router.push("/calendar"); return; }
                  setActiveView(tab.id);
                }}
                className={cn(
                  "flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 relative",
                  activeView === tab.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(activeView === "daily" || activeView === "monthly") && (
          <TransactionSummaryBar
            income={summary.income}
            expense={summary.expense}
            netto={summary.total}
            accountBalance={accountBalance}
            accountLabel={accountLabel}
            accounts={accounts}
            showBreakdown={!filteredAccount && accounts.length > 1}
          />
        )}

        {/* Filter panel */}
        {showFilters && (
          <div className="p-4 space-y-3 bg-background-secondary border-b border-border-light animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Filter</p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterAccount(""); setFilterCategory(""); setSearch(""); }}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  <X size={12} /> Reset
                </button>
              )}
            </div>
            <Input
              placeholder="Cari deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="form-select">
                <option value="">Semua Akun</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select">
                <option value="">Semua Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <LedgerSkeleton />
        ) : activeView === "daily" ? (
          <TransactionLedger
            transactions={transactions}
            onEdit={setEditingTx}
            onDelete={handleDelete}
          />
        ) : activeView === "monthly" ? (
          <div className="py-3 space-y-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([name, amount]) => {
                const cat = categories.find((c) => c.name === name);
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <div key={name} className="surface-card px-4 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <DynamicIcon name={cat?.iconName} size="sm" className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                      <div className="mt-1.5 h-1 bg-background-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-status-danger tabular-nums">{formatCurrencyLedger(amount)}</p>
                      <p className="text-2xs text-text-tertiary mt-0.5">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            {Object.keys(categoryTotals).length === 0 && (
              <p className="text-center text-sm text-text-secondary py-12">Tidak ada pengeluaran</p>
            )}
          </div>
        ) : activeView === "summary" ? (
          <div className="py-3 space-y-3">
            <Card>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                {format(currentMonth, "MMMM yyyy", { locale: id })}
              </p>
              <div className="space-y-3">
                {[
                  { label: "Pemasukan", value: summary.income, color: "text-status-safe" },
                  { label: "Pengeluaran", value: summary.expense, color: "text-status-danger" },
                  { label: "Saldo Bersih", value: summary.total, color: "text-text-primary", bold: true },
                  { label: "Jumlah Transaksi", value: transactions.length, color: "text-text-primary", raw: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">{row.label}</span>
                    <span className={cn("text-sm tabular-nums", row.bold ? "font-bold" : "font-semibold", row.color)}>
                      {row.raw ? row.value : formatCurrencyLedger(row.value as number)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Link href="/reports">
              <Button variant="secondary" fullWidth>Lihat Laporan Lengkap</Button>
            </Link>
          </div>
        ) : activeView === "shortcuts" ? (
          <ShortcutManager
            shortcuts={shortcuts}
            accounts={accounts}
            categories={categories}
            onRefresh={refreshShortcuts}
          />
        ) : null}
      </div>

      <TransactionEditModal
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
        onClose={() => setEditingTx(null)}
        onSaved={handleEditSaved}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LedgerSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}

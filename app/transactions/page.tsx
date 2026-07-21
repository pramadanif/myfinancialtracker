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
import { LedgerSkeleton } from "@/components/ui/LoadingState";
import { formatCurrencyLedger, cn } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import { CATEGORY_ICON_DEFAULTS } from "@/lib/icons";
import type { TransactionWithRelations, QuickShortcutWithRelations } from "@/types";
import type { Account, Category } from "@prisma/client";

const ICON_OPTIONS = Object.values(CATEGORY_ICON_DEFAULTS);

type ViewTab = "daily" | "calendar" | "monthly" | "summary" | "shortcuts";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "daily", label: "Harian" },
  { id: "calendar", label: "Kalender" },
  { id: "monthly", label: "Bulanan" },
  { id: "summary", label: "Ringkasan" },
  { id: "shortcuts", label: "Shortcut" },
];

function SummaryBar({ income, expense, total }: { income: number; expense: number; total: number }) {
  return (
    <div className="grid grid-cols-3 bg-white border-b border-border-light">
      {[
        { label: "Pemasukan", value: income, color: "text-primary" },
        { label: "Pengeluaran", value: expense, color: "text-status-danger" },
        { label: "Saldo", value: total, color: total >= 0 ? "text-text-primary" : "text-status-danger" },
      ].map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "py-3 px-2 text-center",
            i < 2 && "border-r border-border-light"
          )}
        >
          <p className="text-balance-header">{item.label}</p>
          <p className={cn("text-xs font-bold mt-1 tabular-nums", item.color)}>
            {formatCurrencyLedger(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TransactionsContent() {
  const router = useRouter();
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

  const [showShortcutForm, setShowShortcutForm] = useState(false);
  const [shortcutForm, setShortcutForm] = useState({
    label: "", iconName: "zap", accountId: "", categoryId: "", defaultAmount: "",
  });

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

    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
    }
    setLoading(false);
  }, [monthStart, monthEnd, filterAccount, filterCategory, search]);

  useEffect(() => {
    fetchTransactions();
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/shortcuts").then((r) => r.json()).then(setShortcuts);
  }, [fetchTransactions]);

  const summary = computePeriodSummary(transactions);
  const hasActiveFilters = !!(filterAccount || filterCategory || search);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) { fetchTransactions(); router.refresh(); }
  };

  const handleSaveShortcut = async () => {
    const res = await fetch("/api/shortcuts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...shortcutForm,
        defaultAmount: shortcutForm.defaultAmount ? parseInt(shortcutForm.defaultAmount, 10) : null,
      }),
    });
    if (res.ok) {
      setShowShortcutForm(false);
      setShortcutForm({ label: "", iconName: "zap", accountId: "", categoryId: "", defaultAmount: "" });
      fetch("/api/shortcuts").then((r) => r.json()).then(setShortcuts);
    }
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
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border-light safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
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
        <div className="flex items-center justify-center gap-1 pb-3 px-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="icon-btn"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => !isCurrentMonth && setCurrentMonth(new Date())}
            className={cn(
              "flex-1 text-center py-1 rounded-xl transition-colors",
              !isCurrentMonth && "hover:bg-background-secondary"
            )}
          >
            <span className="text-sm font-bold text-text-primary capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </span>
            {!isCurrentMonth && (
              <span className="block text-2xs text-primary font-medium mt-0.5">Kembali ke bulan ini</span>
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
        <div className="flex overflow-x-auto scrollbar-hide border-b border-border-light px-2">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "calendar") { router.push("/calendar"); return; }
                setActiveView(tab.id);
              }}
              className={cn(
                "segment-tab",
                activeView === tab.id && "segment-tab-active"
              )}
            >
              {tab.label}
              {activeView === tab.id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {(activeView === "daily" || activeView === "monthly" || activeView === "summary") && (
          <SummaryBar income={summary.income} expense={summary.expense} total={summary.total} />
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
          <TransactionLedger transactions={transactions} onDelete={handleDelete} />
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
          <div className="py-3 space-y-3">
            <Button fullWidth onClick={() => setShowShortcutForm(true)}>+ Tambah Shortcut</Button>
            {showShortcutForm && (
              <Card className="space-y-3">
                <Input label="Label" value={shortcutForm.label} onChange={(e) => setShortcutForm({ ...shortcutForm, label: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.slice(0, 8).map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setShortcutForm({ ...shortcutForm, iconName: icon })}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                        shortcutForm.iconName === icon ? "border-primary bg-primary-50" : "border-border-light"
                      )}
                    >
                      <DynamicIcon name={icon} size="sm" />
                    </button>
                  ))}
                </div>
                <select value={shortcutForm.accountId} onChange={(e) => setShortcutForm({ ...shortcutForm, accountId: e.target.value })} className="form-select">
                  <option value="">Pilih Akun</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={shortcutForm.categoryId} onChange={(e) => setShortcutForm({ ...shortcutForm, categoryId: e.target.value })} className="form-select">
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input label="Nominal Default" type="number" value={shortcutForm.defaultAmount} onChange={(e) => setShortcutForm({ ...shortcutForm, defaultAmount: e.target.value })} />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setShowShortcutForm(false)}>Batal</Button>
                  <Button fullWidth onClick={handleSaveShortcut}>Simpan</Button>
                </div>
              </Card>
            )}
            {shortcuts.map((s) => (
              <Card key={s.id} padding="sm" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <DynamicIcon name={s.iconName || s.category.iconName} size="md" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-text-tertiary">{s.account.name} · {s.category.name}</p>
                  </div>
                </div>
                <button onClick={async () => { if (confirm("Hapus?")) { await fetch(`/api/shortcuts/${s.id}`, { method: "DELETE" }); fetch("/api/shortcuts").then((r) => r.json()).then(setShortcuts); } }} className="text-xs text-status-danger font-medium px-2">Hapus</button>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
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

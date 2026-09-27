"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, AlertTriangle } from "lucide-react";
import { formatCurrencyShort, cn } from "@/lib/utils";
import { toISODateString, todayAppDateString, parseAppDayStart } from "@/lib/dates";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import TransactionLedger from "@/components/transactions/TransactionLedger";
import TransactionEditModal from "@/components/transactions/TransactionEditModal";
import CalendarSummary from "@/components/calendar/CalendarSummary";
import CalendarHeatGrid from "@/components/calendar/CalendarHeatGrid";
import DayAuditBreakdown from "@/components/calendar/DayAuditBreakdown";
import { computeMonthStats, dayValue, type CalendarDay } from "@/components/calendar/calendar-utils";
import { useQuickAdd } from "@/components/layout/QuickAddProvider";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { Account, Category } from "@prisma/client";
import type { TransactionWithRelations, WeeklyBudgetAlert } from "@/types";

const HIDE_FIXED_KEY = "finance-calendar-hide-fixed";

export default function CalendarPage() {
  const router = useRouter();
  const { openQuickAdd } = useQuickAdd();
  const { version, notifyDataChange } = useDataRefresh();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [hideFixed, setHideFixed] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTransactions, setDayTransactions] = useState<TransactionWithRelations[]>([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [weeklyAlerts, setWeeklyAlerts] = useState<WeeklyBudgetAlert[]>([]);
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const hasActiveFilters = !!(filterAccount || filterCategory);
  const expenseCategories = categories.filter(
    (c) => c.type !== "INCOME" && c.type !== "TRANSFER"
  );

  const fetchCalendar = useCallback(async () => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterCategory) params.set("categoryId", filterCategory);

    const res = await fetch(`/api/calendar?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDays(data.days);
      setWeeklyBudget(data.weeklyBudget ?? 0);
    }
  }, [year, month, filterAccount, filterCategory]);

  useEffect(() => {
    const stored = localStorage.getItem(HIDE_FIXED_KEY);
    if (stored !== null) setHideFixed(stored === "1");
  }, []);

  const updateHideFixed = (value: boolean) => {
    setHideFixed(value);
    localStorage.setItem(HIDE_FIXED_KEY, value ? "1" : "0");
  };

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/budget/alerts", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setWeeklyAlerts(data.alerts || []);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    fetchAlerts();
    fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
    fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()).then(setCategories);
  }, [fetchCalendar, fetchAlerts, version]);

  const fetchDayDetail = useCallback(async (date: string) => {
    const params = new URLSearchParams({ date });
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterCategory) params.set("categoryId", filterCategory);

    const res = await fetch(`/api/calendar?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDayTransactions(data.transactions);
      setDayTotal(data.total);
    }
  }, [filterAccount, filterCategory]);

  useEffect(() => {
    if (selectedDate) fetchDayDetail(selectedDate);
  }, [selectedDate, version, fetchDayDetail]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedDate) fetchDayDetail(selectedDate);
      fetchCalendar();
      fetchAlerts();
      fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
      notifyDataChange();
      router.refresh();
    }
  };

  const handleEditSaved = () => {
    if (selectedDate) fetchDayDetail(selectedDate);
    fetchCalendar();
    fetchAlerts();
    fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
    notifyDataChange();
    router.refresh();
  };

  const resetFilters = () => {
    setFilterAccount("");
    setFilterCategory("");
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  const monthStart = startOfMonth(currentDate);
  const dateKeys = useMemo(() => {
    const start = new Date(year, month, 1);
    return eachDayOfInterval({ start, end: endOfMonth(start) }).map(toISODateString);
  }, [year, month]);
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const isCurrentMonth = isSameMonth(currentDate, new Date());
  const todayKey = todayAppDateString();
  const monthLabel = format(currentDate, "MMMM", { locale: id });
  const elapsedDays = dateKeys.filter((key) => key <= todayKey).length;

  const stats = useMemo(
    () => computeMonthStats(days, dateKeys, elapsedDays, hideFixed),
    [days, dateKeys, elapsedDays, hideFixed]
  );

  const selectedDay = selectedDate ? days[selectedDate] : undefined;

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border-light safe-area-top shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn("icon-btn", (showFilters || hasActiveFilters) && "text-primary bg-primary-50")}
            aria-label="Filter"
          >
            <SlidersHorizontal size={18} strokeWidth={2} />
          </button>
          <h1 className="text-base font-bold text-text-primary">Kalender</h1>
          <div className="w-9" />
        </div>

        <div className="flex items-center justify-center gap-1 pb-2 px-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="icon-btn" aria-label="Bulan sebelumnya">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => !isCurrentMonth && setCurrentDate(new Date())}
            className={cn(
              "min-w-[160px] text-sm font-bold capitalize px-3 py-1.5 rounded-xl transition-colors",
              isCurrentMonth ? "text-text-primary" : "text-primary bg-primary-50"
            )}
          >
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="icon-btn" aria-label="Bulan berikutnya">
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>

        {hasActiveFilters && !showFilters && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {filterAccount && (
              <span className="text-2xs font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary">
                {accounts.find((a) => a.id === filterAccount)?.name}
              </span>
            )}
            {filterCategory && (
              <span className="text-2xs font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary">
                {categories.find((c) => c.id === filterCategory)?.name}
              </span>
            )}
            <button type="button" onClick={resetFilters} className="text-2xs font-medium text-text-tertiary px-1">
              Reset
            </button>
          </div>
        )}

        {showFilters && (
          <div className="px-4 pb-3 space-y-3 bg-background-secondary border-t border-border-light animate-fade-in">
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Filter</p>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="text-xs text-primary font-medium flex items-center gap-1">
                  <X size={12} /> Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Akun</p>
                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="form-select w-full">
                  <option value="">Semua Akun</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Kategori</p>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select w-full">
                  <option value="">Semua Kategori</option>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <CalendarSummary
          monthLabel={monthLabel}
          stats={stats}
          hideFixed={hideFixed}
          onHideFixedChange={updateHideFixed}
          onSelectDay={handleDayClick}
        />

        {isCurrentMonth && weeklyAlerts.length > 0 && (
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning-light px-3 py-2.5">
            <Link href="/budget" className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-status-warning shrink-0" />
              <span className="text-xs font-bold text-text-primary flex-1">Lewat budget minggu ini</span>
              <span className="text-2xs font-medium text-status-warning">Kelola ›</span>
            </Link>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {weeklyAlerts.map((alert) => (
                <span
                  key={alert.id}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-2xs border",
                    alert.percentage >= 100 ? "border-status-danger/25" : "border-status-warning/30"
                  )}
                >
                  <span className="font-semibold text-text-primary">{alert.name}</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      alert.percentage >= 100 ? "text-status-danger" : "text-status-warning"
                    )}
                  >
                    {alert.percentage}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <CalendarHeatGrid
          dateKeys={dateKeys}
          paddingDays={paddingDays}
          days={days}
          avgPerDay={stats.avgPerDay}
          weeklyBudget={weeklyBudget}
          hideFixed={hideFixed}
          todayKey={todayKey}
          selectedDate={selectedDate}
          onSelectDay={handleDayClick}
        />
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDate(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[75vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10 safe-area-top">
              <div>
                <h3 className="font-bold text-text-primary capitalize">
                  {format(parseAppDayStart(selectedDate), "EEEE, d MMMM yyyy", { locale: id })}
                </h3>
                <p className="text-sm text-text-secondary">Total: {formatCurrencyShort(dayTotal)}</p>
              </div>
              <button type="button" onClick={() => setSelectedDate(null)} className="text-2xl text-text-secondary">&times;</button>
            </div>
            <div className="p-4 space-y-3">
              <DayAuditBreakdown
                day={selectedDay}
                value={dayValue(selectedDay, hideFixed)}
                avgPerDay={stats.avgPerDay}
              />
              <TransactionLedger
                transactions={dayTransactions}
                onEdit={setEditingTx}
                onDelete={handleDelete}
              />
              <Button fullWidth onClick={() => { openQuickAdd(selectedDate); setSelectedDate(null); }}>
                + Tambah Transaksi
              </Button>
            </div>
          </div>
        </div>
      )}

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

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrencyShort, cn } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import TransactionLedger from "@/components/transactions/TransactionLedger";
import TransactionEditModal from "@/components/transactions/TransactionEditModal";
import { useQuickAdd } from "@/components/layout/QuickAddProvider";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import type { Account, Category } from "@prisma/client";
import type { TransactionWithRelations } from "@/types";

type DayData = {
  total: number;
  isAboveAverage: boolean;
};

export default function CalendarPage() {
  const router = useRouter();
  const { openQuickAdd } = useQuickAdd();
  const { version, notifyDataChange } = useDataRefresh();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTransactions, setDayTransactions] = useState<TransactionWithRelations[]>([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendar = useCallback(async () => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterCategory) params.set("categoryId", filterCategory);

    const res = await fetch(`/api/calendar?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDays(data.days);
    }
  }, [year, month, filterAccount, filterCategory]);

  useEffect(() => {
    fetchCalendar();
    fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
    fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()).then(setCategories);
  }, [fetchCalendar, version]);

  const fetchDayDetail = useCallback(async (date: string) => {
    const res = await fetch(`/api/calendar?date=${date}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDayTransactions(data.transactions);
      setDayTotal(data.total);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchDayDetail(selectedDate);
  }, [selectedDate, version, fetchDayDetail]);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedDate) fetchDayDetail(selectedDate);
      fetchCalendar();
      fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
      notifyDataChange();
      router.refresh();
    }
  };

  const handleEditSaved = () => {
    if (selectedDate) fetchDayDetail(selectedDate);
    fetchCalendar();
    fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
    notifyDataChange();
    router.refresh();
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const isCurrentMonth = isSameMonth(currentDate, new Date());

  return (
    <div className="page-container">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border-light safe-area-top">
        <div className="flex items-center justify-center px-4 h-14">
          <h1 className="text-base font-bold text-text-primary">Kalender</h1>
        </div>

        <div className="flex items-center justify-center gap-1 pb-3 px-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="icon-btn"
            aria-label="Bulan sebelumnya"
          >
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
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="icon-btn"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="form-select flex-shrink-0 w-auto min-w-[120px]"
          >
            <option value="">Semua Akun</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-select flex-shrink-0 w-auto min-w-[120px]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-4">
        <Card padding="sm">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-text-secondary py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {calendarDays.map((day) => {
              const dateKey = toISODateString(day);
              const dayData = days[dateKey];
              const hasExpense = dayData && dayData.total > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDayClick(dateKey)}
                  className={cn(
                    "flex flex-col items-center p-1 rounded-lg min-h-[52px] transition-colors",
                    isToday(day) ? "bg-primary-light" : "hover:bg-background-secondary",
                    selectedDate === dateKey && "ring-2 ring-primary"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    !isSameMonth(day, currentDate) ? "text-text-secondary" : "text-text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                  {hasExpense && (
                    <>
                      <span className="text-[8px] text-text-secondary leading-tight">
                        {formatCurrencyShort(dayData.total)}
                      </span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-0.5",
                        dayData.isAboveAverage ? "bg-status-danger" : "bg-status-safe"
                      )} />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDate(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[75vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10 safe-area-top">
              <div>
                <h3 className="font-bold text-text-primary">
                  {format(new Date(selectedDate), "d MMMM yyyy", { locale: id })}
                </h3>
                <p className="text-sm text-text-secondary">Total: {formatCurrencyShort(dayTotal)}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-2xl text-text-secondary">&times;</button>
            </div>
            <div className="p-4 space-y-3">
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

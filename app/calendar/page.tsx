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
import { formatCurrencyShort } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TransactionLedger from "@/components/transactions/TransactionLedger";
import { useQuickAdd } from "@/components/layout/QuickAddProvider";
import type { Account, Category } from "@prisma/client";
import type { TransactionWithRelations } from "@/types";

type DayData = {
  total: number;
  isAboveAverage: boolean;
};

export default function CalendarPage() {
  const { openQuickAdd } = useQuickAdd();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTransactions, setDayTransactions] = useState<TransactionWithRelations[]>([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendar = useCallback(async () => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterCategory) params.set("categoryId", filterCategory);

    const res = await fetch(`/api/calendar?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDays(data.days);
    }
  }, [year, month, filterAccount, filterCategory]);

  useEffect(() => {
    fetchCalendar();
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, [fetchCalendar]);

  const fetchDayDetail = async (date: string) => {
    const res = await fetch(`/api/calendar?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      setDayTransactions(data.transactions);
      setDayTotal(data.total);
    }
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    fetchDayDetail(date);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-primary font-bold text-lg">
          ←
        </button>
        <h1 className="text-lg font-bold text-text-primary capitalize">
          {format(currentDate, "MMMM yyyy", { locale: id })}
        </h1>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-primary font-bold text-lg">
          →
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-white">
          <option value="">Semua Akun</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-white">
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

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
                className={`flex flex-col items-center p-1 rounded-lg min-h-[52px] transition-colors ${
                  isToday(day) ? "bg-primary-light" : "hover:bg-background-secondary"
                } ${selectedDate === dateKey ? "ring-2 ring-primary" : ""}`}
              >
                <span className={`text-sm font-medium ${!isSameMonth(day, currentDate) ? "text-text-secondary" : "text-text-primary"}`}>
                  {format(day, "d")}
                </span>
                {hasExpense && (
                  <>
                    <span className="text-[8px] text-text-secondary leading-tight">
                      {formatCurrencyShort(dayData.total)}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      dayData.isAboveAverage ? "bg-status-danger" : "bg-status-safe"
                    }`} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDate(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[75vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-text-primary">
                  {format(new Date(selectedDate), "d MMMM yyyy", { locale: id })}
                </h3>
                <p className="text-sm text-text-secondary">Total: {formatCurrencyShort(dayTotal)}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-2xl text-text-secondary">&times;</button>
            </div>
            <div className="p-4 space-y-3">
              <TransactionLedger transactions={dayTransactions} />
              <Button fullWidth onClick={() => { openQuickAdd(selectedDate); setSelectedDate(null); }}>
                + Tambah Transaksi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

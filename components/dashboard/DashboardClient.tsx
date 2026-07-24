"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatCurrencyShort, cn } from "@/lib/utils";
import { formatDayName } from "@/lib/dates";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import SectionHeader from "@/components/ui/SectionHeader";
import DashboardChart from "@/components/dashboard/DashboardChart";
import AccountOverview from "@/components/dashboard/AccountOverview";
import NotificationSettings from "@/components/pwa/NotificationSettings";
import DynamicIcon from "@/components/ui/DynamicIcon";
import type { DashboardData } from "@/types";

export default function DashboardClient({ data: initialData }: { data: DashboardData }) {
  const { version } = useDataRefresh();
  const [data, setData] = useState(initialData);
  const [visibleTotal, setVisibleTotal] = useState(initialData.totalBalance);

  useEffect(() => {
    setData(initialData);
    setVisibleTotal(initialData.totalBalance);
  }, [initialData]);

  useEffect(() => {
    if (version === 0) return;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((next) => {
        setData(next);
        setVisibleTotal(next.totalBalance);
      });
  }, [version]);

  return (
    <div className="page-container">
      {/* Hero balance card */}
      <div className="px-4 pt-6 pb-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-6 text-white shadow-button">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-white/5" />
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Total Saldo</p>
          <p className="text-2xl sm:text-3xl font-bold mt-2 tabular-nums tracking-tight break-all leading-tight">
            {formatCurrency(visibleTotal)}
          </p>
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-2xs opacity-70 uppercase tracking-wide">Budget Minggu</p>
              <p className="text-sm font-semibold mt-0.5">
                {Math.round(data.weeklyBudget.percentage)}% terpakai
              </p>
            </div>
            <div>
              <p className="text-2xs opacity-70 uppercase tracking-wide">Makan</p>
              <p className="text-sm font-semibold mt-0.5">
                {Math.round(data.foodBudget.percentage)}% terpakai
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-4">
        <AccountOverview accounts={data.accounts} onTotalChange={setVisibleTotal} />

        {data.alerts.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <div
                key={alert.categoryName}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-status-danger-light border border-status-danger/15"
              >
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                  <DynamicIcon name={alert.iconName} size="sm" className="text-status-danger" />
                </div>
                <p className="text-sm text-status-danger font-medium leading-snug">
                  <span className="font-bold">{alert.categoryName}</span> sudah {alert.percentage}% budget minggu ini
                </p>
              </div>
            ))}
          </div>
        )}

        <div>
          <SectionHeader title="Budget Minggu Ini" action={{ label: "Kelola", href: "/budget" }} />
          <Card>
            <ProgressBar
              value={data.weeklyBudget.spent}
              max={data.weeklyBudget.target}
              showValues
              formatValue={(v) => v.toLocaleString("id-ID")}
            />
          </Card>
        </div>

        <div>
          <SectionHeader title="Makan Minggu Ini" />
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <DynamicIcon name="utensils-crossed" size="sm" className="text-primary" />
              </div>
              <span className="text-sm font-medium text-text-primary">Makan & Minum</span>
            </div>
            <ProgressBar
              value={data.foodBudget.spent}
              max={data.foodBudget.target}
              showValues
              formatValue={(v) => v.toLocaleString("id-ID")}
            />
          </Card>
        </div>

        <div>
          <SectionHeader title="7 Hari Terakhir" action={{ label: "Kalender", href: "/calendar" }} />
          <Card padding="sm" className="min-w-0 overflow-hidden">
            <div className="flex justify-between gap-0.5 min-w-0">
              {data.last7Days.map((day) => (
                <Link
                  key={day.date}
                  href={`/calendar?date=${day.date}`}
                  className="flex-1 min-w-0 text-center py-2 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <p className="text-2xs text-text-tertiary font-medium truncate">{formatDayName(day.date)}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-text-primary mt-1 tabular-nums truncate">
                    {day.total > 0 ? formatCurrencyShort(day.total) : "–"}
                  </p>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mx-auto mt-1.5",
                    day.total === 0 ? "bg-border" : day.isAboveAverage ? "bg-status-danger" : "bg-status-safe"
                  )} />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <SectionHeader title="Pengeluaran per Minggu" action={{ label: "Laporan", href: "/reports" }} />
          <Card className="min-w-0 overflow-hidden">
            <DashboardChart data={data.weeklyChart} />
          </Card>
        </div>

        <div>
          <SectionHeader title="Pengaturan App" />
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}

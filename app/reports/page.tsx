"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { CheckinModeToggle } from "@/components/checkin/CheckinModeToggle";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DonutChart from "@/components/reports/DonutChart";
import DynamicIcon from "@/components/ui/DynamicIcon";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Account } from "@prisma/client";
import type { CheckinReportData } from "@/types";
import type { TransactionWithRelations } from "@/types";

type ReportData = {
  categoryBreakdown: { name: string; iconName: string; amount: number }[];
  totalExpense: number;
  totalIncome: number;
  monthlyComparison: { month: string; income: number; outcome: number }[];
  checkin: CheckinReportData & { modeActive: boolean };
};

export default function ReportsPage() {
  const { version } = useDataRefresh();
  const [data, setData] = useState<ReportData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [reportTab, setReportTab] = useState<"all" | "checkin">("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toISODateString(d);
  });
  const [endDate, setEndDate] = useState(toISODateString(new Date()));

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterAccount) params.set("accountId", filterAccount);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    fetch(`/api/reports?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);

    fetch("/api/accounts", { cache: "no-store" }).then((r) => r.json()).then(setAccounts);
  }, [filterAccount, startDate, endDate, version]);

  const handleExport = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (filterAccount) params.set("accountId", filterAccount);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/reports?${params}`, "_blank");
  };

  const checkin = data?.checkin;

  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-text-primary">Laporan</h1>
        <div className="flex items-center gap-2">
          <CheckinModeToggle compact />
          <Button size="sm" variant="secondary" onClick={handleExport}>CSV</Button>
        </div>
      </div>

      <div className="flex rounded-xl bg-background-secondary p-1 gap-1">
        {[
          { id: "all" as const, label: "Semua" },
          { id: "checkin" as const, label: "Check-in" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              reportTab === tab.id ? "bg-white text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white"
        >
          <option value="">Semua Akun</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white col-span-2"
        />
      </div>

      {data && reportTab === "all" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Card padding="sm" className="text-center">
              <p className="text-xs text-text-secondary">Pemasukan</p>
              <p className="text-lg font-bold text-status-safe">{formatCurrencyShort(data.totalIncome)}</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-xs text-text-secondary">Pengeluaran</p>
              <p className="text-lg font-bold text-status-danger">{formatCurrencyShort(data.totalExpense)}</p>
            </Card>
          </div>

          <Card>
            <p className="text-sm font-medium text-text-primary mb-1">Breakdown Kategori</p>
            <DonutChart data={data.categoryBreakdown} totalExpense={data.totalExpense} />
          </Card>

          <Card>
            <p className="text-sm font-medium text-text-primary mb-3">Income vs Outcome (6 Bulan)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyComparison} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#16A34A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="outcome" name="Pengeluaran" fill="#DC2626" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {data && reportTab === "checkin" && checkin && (
        <>
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200/80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary">Pengeluaran Check-in</p>
                <p className="text-2xs text-text-tertiary mt-0.5">
                  Makan, minum, jajan, hotel, dll saat mode check-in aktif
                </p>
                <p className="text-2xl font-bold text-amber-800 mt-2 tabular-nums">
                  {formatCurrencyShort(checkin.totalExpense)}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {checkin.transactionCount} transaksi
                  {checkin.modeActive && " · mode sedang aktif"}
                </p>
              </div>
            </div>
          </Card>

          {checkin.categoryBreakdown.length > 0 ? (
            <Card>
              <p className="text-sm font-medium text-text-primary mb-1">Breakdown Check-in</p>
              <DonutChart data={checkin.categoryBreakdown} totalExpense={checkin.totalExpense} />
            </Card>
          ) : (
            <Card className="text-center py-8">
              <p className="text-sm text-text-secondary">Belum ada pengeluaran check-in di periode ini</p>
              <p className="text-xs text-text-tertiary mt-1">Nyalakan mode check-in lalu catat transaksi</p>
            </Card>
          )}

          {checkin.transactions.length > 0 && (
            <Card padding="sm">
              <p className="text-sm font-medium text-text-primary mb-3 px-1">Detail Transaksi</p>
              <div className="divide-y divide-border-light">
                {(checkin.transactions as TransactionWithRelations[]).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 py-3 px-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <DynamicIcon name={tx.category?.iconName || "map-pin"} size="sm" className="text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {tx.category?.name || "Lainnya"}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {tx.account?.name}{tx.description ? ` · ${tx.description}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-status-danger tabular-nums shrink-0">
                      {formatCurrencyShort(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

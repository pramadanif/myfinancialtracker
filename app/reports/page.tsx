"use client";

import { useState, useEffect } from "react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DonutChart from "@/components/reports/DonutChart";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Account } from "@prisma/client";

type ReportData = {
  categoryBreakdown: { name: string; iconName: string; amount: number }[];
  totalExpense: number;
  totalIncome: number;
  monthlyComparison: { month: string; income: number; outcome: number }[];
};

export default function ReportsPage() {
  const { version } = useDataRefresh();
  const [data, setData] = useState<ReportData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
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

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Laporan</h1>
        <Button size="sm" variant="secondary" onClick={handleExport}>Export CSV</Button>
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

      {data && (
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
    </div>
  );
}

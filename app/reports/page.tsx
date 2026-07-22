"use client";

import { useState, useEffect } from "react";
import { MapPin, Heart } from "lucide-react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { ActivityModeToggles } from "@/components/checkin/CheckinModeToggle";
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
import type { ModeReportData, TransactionWithRelations } from "@/types";

type ReportTab = "all" | "checkin" | "pacaran";

type ReportData = {
  categoryBreakdown: { name: string; iconName: string; amount: number }[];
  totalExpense: number;
  totalIncome: number;
  monthlyComparison: { month: string; income: number; outcome: number }[];
  checkin: ModeReportData & { modeActive: boolean };
  pacaran: ModeReportData & { modeActive: boolean };
};

function ModeReportSection({
  title,
  subtitle,
  icon: Icon,
  accent,
  report,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  icon: typeof MapPin;
  accent: "amber" | "rose";
  report: ModeReportData & { modeActive: boolean };
  emptyHint: string;
}) {
  const styles = accent === "amber"
    ? { card: "from-amber-50 to-white border-amber-200/80", icon: "bg-amber-100 text-amber-700", total: "text-amber-800", chip: "bg-amber-50 text-amber-700" }
    : { card: "from-rose-50 to-white border-rose-200/80", icon: "bg-rose-100 text-rose-700", total: "text-rose-800", chip: "bg-rose-50 text-rose-700" };

  return (
    <>
      <Card className={`bg-gradient-to-br ${styles.card}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">{title}</p>
            <p className="text-2xs text-text-tertiary mt-0.5">{subtitle}</p>
            <p className={`text-2xl font-bold mt-2 tabular-nums ${styles.total}`}>
              {formatCurrencyShort(report.totalExpense)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {report.transactionCount} transaksi
              {report.modeActive && " · mode sedang aktif"}
            </p>
          </div>
        </div>
      </Card>

      {report.categoryBreakdown.length > 0 ? (
        <Card>
          <p className="text-sm font-medium text-text-primary mb-1">Breakdown {title}</p>
          <DonutChart data={report.categoryBreakdown} totalExpense={report.totalExpense} />
        </Card>
      ) : (
        <Card className="text-center py-8">
          <p className="text-sm text-text-secondary">Belum ada pengeluaran di periode ini</p>
          <p className="text-xs text-text-tertiary mt-1">{emptyHint}</p>
        </Card>
      )}

      {report.transactions.length > 0 && (
        <Card padding="sm">
          <p className="text-sm font-medium text-text-primary mb-3 px-1">Detail Transaksi</p>
          <div className="divide-y divide-border-light">
            {(report.transactions as TransactionWithRelations[]).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3 px-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.chip}`}>
                  <DynamicIcon name={tx.category?.iconName || "circle-dollar-sign"} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{tx.category?.name || "Lainnya"}</p>
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
  );
}

export default function ReportsPage() {
  const { version } = useDataRefresh();
  const [data, setData] = useState<ReportData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [reportTab, setReportTab] = useState<ReportTab>("all");
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
    <div className="px-4 pt-6 space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-text-primary">Laporan</h1>
        <div className="flex items-center gap-2">
          <ActivityModeToggles compact />
          <Button size="sm" variant="secondary" onClick={handleExport}>CSV</Button>
        </div>
      </div>

      <div className="flex rounded-xl bg-background-secondary p-1 gap-1 overflow-x-auto">
        {[
          { id: "all" as const, label: "Semua" },
          { id: "checkin" as const, label: "Check-in" },
          { id: "pacaran" as const, label: "Pacaran" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`flex-1 min-w-[72px] py-2 rounded-lg text-xs font-semibold transition-all ${
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

      {data && reportTab === "checkin" && data.checkin && (
        <ModeReportSection
          title="Pengeluaran Check-in"
          subtitle="Makan, minum, jajan, hotel saat mode check-in"
          icon={MapPin}
          accent="amber"
          report={data.checkin}
          emptyHint="Nyalakan mode check-in lalu catat transaksi"
        />
      )}

      {data && reportTab === "pacaran" && data.pacaran && (
        <ModeReportSection
          title="Pengeluaran Pacaran"
          subtitle="Makan, jajan, nonton, gift saat mode pacaran"
          icon={Heart}
          accent="rose"
          report={data.pacaran}
          emptyHint="Nyalakan mode pacaran lalu catat transaksi"
        />
      )}
    </div>
  );
}

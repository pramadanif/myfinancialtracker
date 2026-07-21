"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/icons";
import DynamicIcon from "@/components/ui/DynamicIcon";

type BreakdownItem = {
  name: string;
  iconName: string;
  amount: number;
};

interface DonutChartProps {
  data: BreakdownItem[];
  totalExpense: number;
}

export default function DonutChart({ data, totalExpense }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = data.map((item, i) => ({
    ...item,
    percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const renderActiveShape = (props: unknown) => {
    const p = props as {
      cx: number;
      cy: number;
      innerRadius: number;
      outerRadius: number;
      startAngle: number;
      endAngle: number;
      fill: string;
    };
    return <Sector {...p} outerRadius={p.outerRadius + 6} />;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
        <DynamicIcon name="chart-pie" size="xl" className="mb-2 opacity-40" />
        <p className="text-sm">Tidak ada data pengeluaran</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              dataKey="amount"
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onClick={(_, index) =>
                setActiveIndex(activeIndex === index ? null : index)
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] text-text-secondary">Total</p>
          <p className="text-base font-bold text-text-primary">
            {formatCurrencyShort(totalExpense)}
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-2">
        {chartData.map((item) => (
          <button
            key={item.name}
            onClick={() =>
              setActiveIndex(
                chartData.findIndex((d) => d.name === item.name) === activeIndex
                  ? null
                  : chartData.findIndex((d) => d.name === item.name)
              )
            }
            className="flex items-center justify-between w-full py-1.5 px-1 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <DynamicIcon name={item.iconName} size="sm" className="text-text-secondary" />
              <span className="text-sm text-text-primary truncate">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-text-primary flex-shrink-0 ml-2">
              {formatCurrencyShort(item.amount)}{" "}
              <span className="text-text-secondary font-normal">({item.percentage}%)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

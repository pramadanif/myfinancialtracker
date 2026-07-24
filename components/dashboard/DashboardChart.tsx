"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DashboardChartProps {
  data: {
    week: string;
    categories: { name: string; amount: number; iconName: string }[];
  }[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const allCategories = new Set<string>();
  data.forEach((week) => {
    week.categories.forEach((cat) => allCategories.add(cat.name));
  });

  const topCategories = Array.from(allCategories).slice(0, 5);

  const chartData = data.map((week) => {
    const entry: Record<string, string | number> = { week: week.week };
    topCategories.forEach((catName) => {
      const cat = week.categories.find((c) => c.name === catName);
      entry[catName] = cat?.amount || 0;
    });
    return entry;
  });

  const colors = ["#0055A4", "#16A34A", "#F59E0B", "#DC2626", "#718096"];

  return (
    <div className="h-48 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -24, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={0} />
          <YAxis tick={{ fontSize: 9 }} width={36} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
          <Tooltip
            formatter={(value: number) => [`Rp${value.toLocaleString("id-ID")}`, ""]}
            labelStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {topCategories.map((cat, i) => (
            <Bar key={cat} dataKey={cat} fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

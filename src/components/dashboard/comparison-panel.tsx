"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "./chart-tooltip";
import { formatCurrencyCompact } from "@/lib/utils";
import { SEMANTIC_COLORS } from "@/lib/colors";
import type { DashboardKpis } from "@/types";

export function ComparisonPanel({
  kpis,
  currentLabel,
  previousLabel,
}: {
  kpis: DashboardKpis;
  currentLabel: string;
  previousLabel: string;
}) {
  const data = [
    {
      metric: "Omzet",
      current: kpis.omzet.current,
      previous: kpis.omzet.previous,
      color: SEMANTIC_COLORS.income.light,
    },
    {
      metric: "Pengeluaran",
      current: kpis.expense.current,
      previous: kpis.expense.previous,
      color: SEMANTIC_COLORS.expense.light,
    },
    {
      metric: "Net Profit",
      current: kpis.netProfit.current,
      previous: kpis.netProfit.previous,
      color: SEMANTIC_COLORS.profit.light,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan Periode</CardTitle>
        <CardDescription>
          {currentLabel} vs {previousLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="metric" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v)}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltipCard
                    title={d.metric}
                    rows={[
                      { label: currentLabel, value: d.current, color: d.color },
                      { label: previousLabel, value: d.previous, color: "var(--muted-foreground)" },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="previous" name={previousLabel} fill="var(--muted-foreground)" opacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="current" name={currentLabel} radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((d) => (
                <Cell key={d.metric} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {data.map((d) => (
            <span key={d.metric} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.metric}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

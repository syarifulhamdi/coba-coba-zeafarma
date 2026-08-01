"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "./chart-tooltip";
import { formatCurrencyCompact } from "@/lib/utils";
import { SEMANTIC_COLORS } from "@/lib/colors";
import type { MonthlyPoint } from "@/types";

interface TrendChartProps {
  data: MonthlyPoint[];
  focusCategory: { label: string; color: string; type: "income" | "expense" } | null;
}

export function TrendChart({ data, focusCategory }: TrendChartProps) {
  const hasTarget = data.some((d) => d.target !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{focusCategory ? `Tren "${focusCategory.label}"` : "Tren Omzet & Profit Bulanan"}</CardTitle>
        <CardDescription>
          {focusCategory
            ? "Nilai bulanan untuk kategori yang sedang difokuskan."
            : hasTarget
              ? "Omzet, pengeluaran, dan net profit per bulan, dengan target profit dari sheet Setup."
              : "Omzet, pengeluaran, dan net profit per bulan."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
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
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = focusCategory
                  ? [{ label: focusCategory.label, value: (payload[0].payload as { focusValue: number }).focusValue, color: focusCategory.color }]
                  : [
                      { label: "Omzet", value: (payload[0].payload as MonthlyPoint).income, color: SEMANTIC_COLORS.income.light },
                      { label: "Pengeluaran", value: (payload[0].payload as MonthlyPoint).expense, color: SEMANTIC_COLORS.expense.light },
                      { label: "Net Profit", value: (payload[0].payload as MonthlyPoint).profit, color: SEMANTIC_COLORS.profit.light },
                      ...(((payload[0].payload as MonthlyPoint).target !== null
                        ? [{ label: "Target Profit", value: (payload[0].payload as MonthlyPoint).target as number, color: SEMANTIC_COLORS.target.light }]
                        : [])),
                    ];
                return <ChartTooltipCard title={String(label)} rows={rows} />;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            {focusCategory ? (
              <Bar dataKey="focusValue" name={focusCategory.label} fill={focusCategory.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
            ) : (
              <>
                <Bar dataKey="income" name="Omzet" fill={SEMANTIC_COLORS.income.light} radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="expense" name="Pengeluaran" fill={SEMANTIC_COLORS.expense.light} radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke={SEMANTIC_COLORS.profit.light}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                {hasTarget && (
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target Profit"
                    stroke={SEMANTIC_COLORS.target.light}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

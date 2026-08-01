"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltipCard } from "./chart-tooltip";
import { formatCurrencyCompact } from "@/lib/utils";
import type { CategoryTotal } from "@/types";

interface CategoryChartProps {
  title: string;
  description: string;
  data: CategoryTotal[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function IncomeCategoryChart({ title, description, data, selected, onSelect }: CategoryChartProps) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-56 w-56 shrink-0">
              <PieChart width={224} height={224}>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  cx={112}
                  cy={112}
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="var(--card)"
                  strokeWidth={2}
                  onClick={(entry) => {
                    const category = (entry as unknown as CategoryTotal).category;
                    onSelect(selected === category ? null : category);
                  }}
                  className="cursor-pointer outline-none"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={entry.color}
                      opacity={selected && selected !== entry.category ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as CategoryTotal;
                    return <ChartTooltipCard title={d.category} rows={[{ label: "Total", value: d.total, color: d.color }]} />;
                  }}
                />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-muted-foreground">Total</span>
                <span className="text-sm font-semibold tabular-nums">{formatCurrencyCompact(total)}</span>
              </div>
            </div>

            <ul className="flex w-full flex-col gap-1.5">
              {data.map((entry) => {
                const isSelected = selected === entry.category;
                const isDimmed = selected !== null && !isSelected;
                return (
                  <li key={entry.category}>
                    <button
                      type="button"
                      onClick={() => onSelect(isSelected ? null : entry.category)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                        isSelected ? "bg-accent" : ""
                      } ${isDimmed ? "opacity-50" : ""}`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                        <span className="truncate">{entry.category}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {(entry.share * 100).toFixed(0)}%
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseCategoryChart({ title, description, data, selected, onSelect }: CategoryChartProps) {
  const chartHeight = Math.max(220, data.length * 34);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => formatCurrencyCompact(v)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={168}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as CategoryTotal;
                  return <ChartTooltipCard title={d.category} rows={[{ label: "Total", value: d.total, color: d.color }]} />;
                }}
              />
              <Bar
                dataKey="total"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                onClick={(entry) => {
                  const category = (entry as unknown as CategoryTotal).category;
                  onSelect(selected === category ? null : category);
                }}
                className="cursor-pointer"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={entry.color}
                    opacity={selected && selected !== entry.category ? 0.35 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      Tidak ada data untuk periode ini.
    </div>
  );
}

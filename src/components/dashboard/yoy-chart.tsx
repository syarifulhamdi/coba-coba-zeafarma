"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "./chart-tooltip";
import { SEMANTIC_COLORS } from "@/lib/colors";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";
import type { YoyPoint } from "@/types";

const CURRENT_COLOR = SEMANTIC_COLORS.profit.light;
const PREVIOUS_COLOR = SEMANTIC_COLORS.target.light;

interface YoyChartProps {
  data: YoyPoint[];
  year: number;
  title: string;
  description: string;
  /** Counts render as plain numbers, money as rupiah. */
  kind?: "currency" | "count";
}

export function YoyChart({ data, year, title, description, kind = "currency" }: YoyChartProps) {
  const format = kind === "count" ? formatNumber : formatCurrency;
  const axisFormat = kind === "count" ? formatNumber : formatCurrencyCompact;

  // Only months present in both years can be compared; comparing a full year
  // against a part-year total would overstate the drop.
  const comparable = data.filter((d) => d.current !== null && d.previous !== null);
  const currentTotal = comparable.reduce((acc, d) => acc + (d.current ?? 0), 0);
  const previousTotal = comparable.reduce((acc, d) => acc + (d.previous ?? 0), 0);
  const deltaPercent = previousTotal !== 0 ? ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100 : null;

  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {comparable.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {comparable.length} bulan yang bisa dibandingkan ({comparable[0].label}–
              {comparable[comparable.length - 1].label}):
            </span>
            <span className="tabular-nums font-semibold text-foreground">{format(currentTotal)}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="tabular-nums text-muted-foreground">{format(previousTotal)}</span>
            {deltaPercent !== null && (
              <span
                className={`tabular-nums font-semibold ${deltaPercent >= 0 ? "text-success" : "text-destructive"}`}
              >
                {formatPercent(deltaPercent)}
              </span>
            )}
          </div>
        )}

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(v) => axisFormat(v)}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={kind === "count" ? 44 : 64}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as YoyPoint;
                const rows = [];
                if (point.current !== null)
                  rows.push({ label: String(year), value: point.current, color: CURRENT_COLOR });
                if (point.previous !== null)
                  rows.push({ label: String(year - 1), value: point.previous, color: PREVIOUS_COLOR });
                if (rows.length === 0) return null;
                const bothPresent = point.current !== null && point.previous !== null;
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    rows={rows}
                    format={format}
                    footer={
                      bothPresent
                        ? { label: "Selisih", value: (point.current as number) - (point.previous as number) }
                        : undefined
                    }
                  />
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            <Line
              type="monotone"
              dataKey="previous"
              name={String(year - 1)}
              stroke={PREVIOUS_COLOR}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              name={String(year)}
              stroke={CURRENT_COLOR}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

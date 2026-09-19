"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "./chart-tooltip";
import { VISIT_PAIR_COLORS } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";
import type { VisitBreakdownItem, VisitMonthlyPoint } from "@/types";

const SURFACE_GAP = { stroke: "var(--card)", strokeWidth: 2 };

export function VisitTrendChart({ data }: { data: VisitMonthlyPoint[] }) {
  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle>Tren Kunjungan Bulanan</CardTitle>
        <CardDescription>Jumlah pasien baru dan pasien lama per bulan.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as VisitMonthlyPoint;
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    format={formatNumber}
                    rows={[
                      { label: "Pasien Baru", value: point.baru, color: VISIT_PAIR_COLORS.primary.light },
                      { label: "Pasien Lama", value: point.lama, color: VISIT_PAIR_COLORS.secondary.light },
                    ]}
                    footer={{ label: "Total", value: point.total }}
                  />
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            <Bar
              dataKey="baru"
              name="Pasien Baru"
              stackId="visits"
              fill={VISIT_PAIR_COLORS.primary.light}
              maxBarSize={32}
              {...SURFACE_GAP}
            />
            <Bar
              dataKey="lama"
              name="Pasien Lama"
              stackId="visits"
              fill={VISIT_PAIR_COLORS.secondary.light}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              {...SURFACE_GAP}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Horizontal bars with a value label on every row. The labels are required,
 * not decorative: several of the service hues sit below 3:1 against the card
 * surface, and a readable number is the documented relief for that.
 */
export function VisitBreakdownChart({
  title,
  description,
  data,
  emptyLabel = "Tidak ada data untuk periode ini.",
}: {
  title: string;
  description: string;
  data: VisitBreakdownItem[];
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <Card className="print-block">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  const height = Math.max(180, data.length * 34 + 24);

  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={132}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as VisitBreakdownItem;
                return (
                  <ChartTooltipCard
                    title={item.label}
                    format={formatNumber}
                    rows={[{ label: "Kunjungan", value: item.total, color: item.color }]}
                    footer={{ label: "Porsi", value: Math.round(item.share * 100) }}
                  />
                );
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22} {...SURFACE_GAP}>
              {data.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                offset={8}
                fontSize={11}
                fill="var(--foreground)"
                formatter={(value: unknown) => formatNumber(Number(value) || 0)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function GenderSplitCard({ data }: { data: VisitBreakdownItem[] }) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle>Komposisi Gender</CardTitle>
        <CardDescription>Proporsi kunjungan laki-laki dan perempuan.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada data untuk periode ini.</p>
        ) : (
          <>
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
              {data.map((item) => (
                <div
                  key={item.label}
                  style={{ width: `${item.share * 100}%`, background: item.color }}
                  title={`${item.label}: ${formatNumber(item.total)}`}
                />
              ))}
            </div>
            <ul className="flex flex-col gap-2">
              {data.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatNumber(item.total)}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      {(item.share * 100).toFixed(1)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

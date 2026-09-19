"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn, formatPercent } from "@/lib/utils";
import type { KpiComparison } from "@/types";

/**
 * `invert` marks metrics where a rise is bad (expenses), so the delta colour
 * follows the business meaning rather than the arrow direction.
 */
export function Delta({ comparison, invert = false }: { comparison: KpiComparison; invert?: boolean }) {
  if (comparison.deltaPercent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="h-3.5 w-3.5" aria-hidden />
        belum ada pembanding
      </span>
    );
  }
  const isUp = comparison.deltaPercent > 0;
  const isFlat = comparison.deltaPercent === 0;
  const positive = invert ? !isUp : isUp;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isFlat
          ? "bg-muted text-muted-foreground"
          : positive
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {formatPercent(comparison.deltaPercent)}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  comparison?: KpiComparison;
  invert?: boolean;
  hint?: string;
  accent?: string;
  /** Recent values, oldest first, drawn as a background sparkline. */
  spark?: number[];
}

export function StatCard({ title, value, icon: Icon, comparison, invert, hint, accent, spark }: StatCardProps) {
  const color = accent ?? "var(--primary)";
  const sparkData = spark && spark.length > 1 ? spark.map((v, i) => ({ i, v })) : null;
  const gradientId = `spark-${title.replace(/[^a-zA-Z]/g, "")}`;

  return (
    <div className="print-block print-surface group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
      {/* Brand hairline that picks up the metric's own colour. */}
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color, opacity: 0.85 }} />

      <div className="relative z-10 p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {value}
        </p>

        <div className="mt-2.5 flex min-h-[24px] items-center gap-2">
          {comparison ? (
            <>
              <Delta comparison={comparison} invert={invert} />
              {comparison.deltaPercent !== null && (
                <span className="text-xs text-muted-foreground">vs periode lalu</span>
              )}
            </>
          ) : hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </div>

      {sparkData && (
        <div className="pointer-events-none h-10 w-full opacity-70" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

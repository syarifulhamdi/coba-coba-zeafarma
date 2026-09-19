import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
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
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        isFlat ? "text-muted-foreground" : positive ? "text-success" : "text-destructive"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {formatPercent(comparison.deltaPercent)}
      <span className="font-normal text-muted-foreground">vs periode lalu</span>
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
}

export function StatCard({ title, value, icon: Icon, comparison, invert, hint, accent }: StatCardProps) {
  return (
    <div className="print-block print-surface rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: accent ? `color-mix(in srgb, ${accent} 12%, transparent)` : "var(--secondary)",
            color: accent ?? "var(--primary)",
          }}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <div className="mt-1.5 min-h-[18px]">
        {comparison ? <Delta comparison={comparison} invert={invert} /> : hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

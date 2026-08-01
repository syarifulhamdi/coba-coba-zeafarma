import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardKpis, KpiComparison } from "@/types";

function Delta({ comparison, invert = false }: { comparison: KpiComparison; invert?: boolean }) {
  if (comparison.deltaPercent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="h-3.5 w-3.5" /> tidak ada data pembanding
      </span>
    );
  }
  const isUp = comparison.deltaPercent > 0;
  const isFlat = comparison.deltaPercent === 0;
  const positive = invert ? !isUp : isUp;
  const colorClass = isFlat ? "text-muted-foreground" : positive ? "text-success" : "text-destructive";
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold tabular-nums", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(comparison.deltaPercent)}
      <span className="font-normal text-muted-foreground">vs periode lalu</span>
    </span>
  );
}

function KpiCard({
  title,
  value,
  comparison,
  invert,
}: {
  title: string;
  value: string;
  comparison: KpiComparison;
  invert?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        <Delta comparison={comparison} invert={invert} />
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Total Omzet" value={formatCurrency(kpis.omzet.current)} comparison={kpis.omzet} />
      <KpiCard title="Total Pengeluaran" value={formatCurrency(kpis.expense.current)} comparison={kpis.expense} invert />
      <KpiCard title="Net Profit" value={formatCurrency(kpis.netProfit.current)} comparison={kpis.netProfit} />
      <KpiCard
        title="Margin %"
        value={`${kpis.marginPercent.current.toFixed(1)}%`}
        comparison={kpis.marginPercent}
      />
    </div>
  );
}

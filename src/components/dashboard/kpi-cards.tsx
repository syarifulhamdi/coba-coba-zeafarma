import { Percent, TrendingUp, Wallet, Receipt } from "lucide-react";
import { StatCard } from "./stat-card";
import { SEMANTIC_COLORS } from "@/lib/colors";
import { formatCurrency } from "@/lib/utils";
import type { DashboardKpis, MonthlyPoint } from "@/types";

export function KpiCards({ kpis, trend = [] }: { kpis: DashboardKpis; trend?: MonthlyPoint[] }) {
  const recent = trend.slice(-12);
  const margins = recent.map((p) => (p.income !== 0 ? ((p.income - p.expense) / p.income) * 100 : 0));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Omzet"
        value={formatCurrency(kpis.omzet.current)}
        icon={Wallet}
        comparison={kpis.omzet}
        accent={SEMANTIC_COLORS.income.light}
        spark={recent.map((p) => p.income)}
      />
      <StatCard
        title="Total Pengeluaran"
        value={formatCurrency(kpis.expense.current)}
        icon={Receipt}
        comparison={kpis.expense}
        invert
        accent={SEMANTIC_COLORS.expense.light}
        spark={recent.map((p) => p.expense)}
      />
      <StatCard
        title="Net Profit"
        value={formatCurrency(kpis.netProfit.current)}
        icon={TrendingUp}
        comparison={kpis.netProfit}
        accent={SEMANTIC_COLORS.profit.light}
        spark={recent.map((p) => p.profit)}
      />
      <StatCard
        title="Margin"
        value={`${kpis.marginPercent.current.toFixed(1)}%`}
        icon={Percent}
        comparison={kpis.marginPercent}
        spark={margins}
      />
    </div>
  );
}

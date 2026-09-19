import { Percent, TrendingUp, Wallet, Receipt } from "lucide-react";
import { StatCard } from "./stat-card";
import { SEMANTIC_COLORS } from "@/lib/colors";
import { formatCurrency } from "@/lib/utils";
import type { DashboardKpis } from "@/types";

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Omzet"
        value={formatCurrency(kpis.omzet.current)}
        icon={Wallet}
        comparison={kpis.omzet}
        accent={SEMANTIC_COLORS.income.light}
      />
      <StatCard
        title="Total Pengeluaran"
        value={formatCurrency(kpis.expense.current)}
        icon={Receipt}
        comparison={kpis.expense}
        invert
        accent={SEMANTIC_COLORS.expense.light}
      />
      <StatCard
        title="Net Profit"
        value={formatCurrency(kpis.netProfit.current)}
        icon={TrendingUp}
        comparison={kpis.netProfit}
        accent={SEMANTIC_COLORS.profit.light}
      />
      <StatCard
        title="Margin"
        value={`${kpis.marginPercent.current.toFixed(1)}%`}
        icon={Percent}
        comparison={kpis.marginPercent}
      />
    </div>
  );
}

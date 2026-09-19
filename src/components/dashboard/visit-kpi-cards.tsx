import { Percent, UserPlus, UserCheck, Users } from "lucide-react";
import { StatCard } from "./stat-card";
import { VISIT_PAIR_COLORS } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";
import type { VisitKpis, VisitMonthlyPoint } from "@/types";

export function VisitKpiCards({ kpis, trend = [] }: { kpis: VisitKpis; trend?: VisitMonthlyPoint[] }) {
  // Months with no data at all would flatten the sparkline to zero, which reads
  // as a collapse rather than "not recorded yet".
  const recent = trend.slice(-12).filter((p) => p.total > 0);
  const rates = recent.map((p) => (p.total !== 0 ? (p.baru / p.total) * 100 : 0));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Kunjungan"
        value={formatNumber(kpis.total.current)}
        icon={Users}
        comparison={kpis.total}
        spark={recent.map((p) => p.total)}
      />
      <StatCard
        title="Pasien Baru"
        value={formatNumber(kpis.baru.current)}
        icon={UserPlus}
        comparison={kpis.baru}
        accent={VISIT_PAIR_COLORS.primary.light}
        spark={recent.map((p) => p.baru)}
      />
      <StatCard
        title="Pasien Lama"
        value={formatNumber(kpis.lama.current)}
        icon={UserCheck}
        comparison={kpis.lama}
        accent={VISIT_PAIR_COLORS.secondary.light}
        spark={recent.map((p) => p.lama)}
      />
      <StatCard
        title="Porsi Pasien Baru"
        value={`${kpis.newPatientRate.current.toFixed(1)}%`}
        icon={Percent}
        comparison={kpis.newPatientRate}
        spark={rates}
      />
    </div>
  );
}

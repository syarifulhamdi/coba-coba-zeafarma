import { Percent, UserPlus, UserCheck, Users } from "lucide-react";
import { StatCard } from "./stat-card";
import { VISIT_PAIR_COLORS } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";
import type { VisitKpis } from "@/types";

export function VisitKpiCards({ kpis }: { kpis: VisitKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Kunjungan"
        value={formatNumber(kpis.total.current)}
        icon={Users}
        comparison={kpis.total}
      />
      <StatCard
        title="Pasien Baru"
        value={formatNumber(kpis.baru.current)}
        icon={UserPlus}
        comparison={kpis.baru}
        accent={VISIT_PAIR_COLORS.primary.light}
      />
      <StatCard
        title="Pasien Lama"
        value={formatNumber(kpis.lama.current)}
        icon={UserCheck}
        comparison={kpis.lama}
        accent={VISIT_PAIR_COLORS.secondary.light}
      />
      <StatCard
        title="Porsi Pasien Baru"
        value={`${kpis.newPatientRate.current.toFixed(1)}%`}
        icon={Percent}
        comparison={kpis.newPatientRate}
      />
    </div>
  );
}

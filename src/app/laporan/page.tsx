import { getSnapshot } from "@/lib/data";
import { defaultFilters, parseFilters } from "@/lib/filters";
import {
  buildKpis,
  buildMonthlySeries,
  categoryTotals,
  getPeriodRange,
  inRange,
  lastMonthWithData,
  periodKeysForFilters,
} from "@/lib/aggregate";
import {
  buildVisitKpis,
  buildVisitMonthlySeries,
  monthKeysBetween,
  visitBreakdown,
  visitsInPeriods,
} from "@/lib/visit-aggregate";
import { ReportSheet, type ReportData } from "@/components/report/report-sheet";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const snapshot = await getSnapshot();
  const resolved = await searchParams;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) params.set(key, value[0]);
  }

  const filters = parseFilters(params, defaultFilters([...snapshot.income, ...snapshot.expenses]));
  const lastMonth = lastMonthWithData(
    Number(filters.year),
    [...snapshot.income, ...snapshot.expenses],
    snapshot.visits.map((v) => v.periodKey)
  );
  const range = getPeriodRange(filters, { lastMonthWithData: lastMonth ?? undefined });
  const periods = periodKeysForFilters(filters);

  const incomeCur = snapshot.income.filter((t) => inRange(t, range.start, range.end));
  const expenseCur = snapshot.expenses.filter((t) => inRange(t, range.start, range.end));
  const comparing = filters.compare !== "none";
  const incomePrev = comparing ? snapshot.income.filter((t) => inRange(t, range.prevStart, range.prevEnd)) : [];
  const expensePrev = comparing ? snapshot.expenses.filter((t) => inRange(t, range.prevStart, range.prevEnd)) : [];

  const visitsCur = visitsInPeriods(snapshot.visits, monthKeysBetween(range.start, range.end));
  const visitsPrev = comparing
    ? visitsInPeriods(snapshot.visits, monthKeysBetween(range.prevStart, range.prevEnd))
    : [];

  const data: ReportData = {
    periodLabel: range.label,
    previousLabel: range.prevLabel,
    compareLabel: comparing ? range.prevLabel : "tidak ada",
    generatedAt: new Date().toISOString(),
    kpis: buildKpis(incomeCur, incomePrev, expenseCur, expensePrev),
    visitKpis: buildVisitKpis(visitsCur, visitsPrev),
    trend: buildMonthlySeries(snapshot.income, snapshot.expenses, snapshot.profitGoals, periods),
    visitTrend: buildVisitMonthlySeries(snapshot.visits, periods),
    incomeCategories: categoryTotals(incomeCur, "income"),
    expenseCategories: categoryTotals(expenseCur, "expense"),
    services: visitBreakdown(visitsCur, "service"),
    staff: visitBreakdown(visitsCur, "staff"),
    gender: visitBreakdown(visitsCur, "gender"),
    hasVisitData: visitsCur.length > 0,
  };

  return <ReportSheet data={data} />;
}

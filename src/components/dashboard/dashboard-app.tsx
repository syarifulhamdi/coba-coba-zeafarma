"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandHeader } from "./brand-header";
import { ExportMenu } from "./export-menu";
import { KpiCards } from "./kpi-cards";
import { PeriodFilter } from "./period-filter";
import { IncomeCategoryChart, ExpenseCategoryChart } from "./category-charts";
import { TrendChart } from "./trend-chart";
import { ComparisonPanel } from "./comparison-panel";
import { TransactionsTable } from "./transactions-table";
import { VisitKpiCards } from "./visit-kpi-cards";
import { GenderSplitCard, VisitBreakdownChart, VisitTrendChart } from "./visit-charts";
import { YoyChart } from "./yoy-chart";
import {
  buildCategoryMonthlySeries,
  buildKpis,
  buildMonthlySeries,
  buildYoySeries,
  categoryTotals,
  filterByCategory,
  getPeriodRange,
  inRange,
  lastMonthWithData,
  periodKeysForFilters,
} from "@/lib/aggregate";
import {
  buildVisitKpis,
  buildVisitMonthlySeries,
  buildVisitYoySeries,
  monthKeysBetween,
  visitBreakdown,
  visitsInPeriods,
  visitYears,
} from "@/lib/visit-aggregate";
import { defaultFilters, filtersToParams, parseFilters } from "@/lib/filters";
import { incomeCategoryColor, expenseCategoryColor } from "@/lib/colors";
import type { DashboardFilters, DashboardView, SheetsSnapshot } from "@/types";

export function DashboardApp({
  snapshot,
  userName,
  buildId,
}: {
  snapshot: SheetsSnapshot;
  userName?: string;
  buildId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallback = useMemo(() => defaultFilters([...snapshot.income, ...snapshot.expenses]), [snapshot]);
  const filters = useMemo(() => parseFilters(searchParams, fallback), [searchParams, fallback]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const t of [...snapshot.income, ...snapshot.expenses]) years.add(String(t.year));
    for (const y of visitYears(snapshot.visits)) years.add(y);
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [snapshot]);

  const updateFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = { ...filters, ...patch };
      router.replace(`${pathname}?${filtersToParams(next).toString()}`, { scroll: false });
    },
    [filters, pathname, router]
  );

  useEffect(() => {
    if (!searchParams.get("mode")) {
      router.replace(`${pathname}?${filtersToParams(filters).toString()}`, { scroll: false });
    }
    // Only run this sync on first mount; `filters` already falls back correctly afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const range = useMemo(() => {
    const year = Number(filters.year);
    const lastMonth = lastMonthWithData(
      year,
      [...snapshot.income, ...snapshot.expenses],
      snapshot.visits.map((v) => v.periodKey)
    );
    return getPeriodRange(filters, { lastMonthWithData: lastMonth ?? undefined });
  }, [filters, snapshot]);
  const periods = useMemo(() => periodKeysForFilters(filters), [filters]);

  const incomeInPeriod = useMemo(
    () => snapshot.income.filter((t) => inRange(t, range.start, range.end)),
    [snapshot.income, range]
  );
  const expenseInPeriod = useMemo(
    () => snapshot.expenses.filter((t) => inRange(t, range.start, range.end)),
    [snapshot.expenses, range]
  );
  const incomePrev = useMemo(
    () => (filters.compare === "none" ? [] : snapshot.income.filter((t) => inRange(t, range.prevStart, range.prevEnd))),
    [snapshot.income, range, filters.compare]
  );
  const expensePrev = useMemo(
    () => (filters.compare === "none" ? [] : snapshot.expenses.filter((t) => inRange(t, range.prevStart, range.prevEnd))),
    [snapshot.expenses, range, filters.compare]
  );

  const kpis = useMemo(
    () => buildKpis(incomeInPeriod, incomePrev, expenseInPeriod, expensePrev),
    [incomeInPeriod, incomePrev, expenseInPeriod, expensePrev]
  );

  const incomeCategoryData = useMemo(() => categoryTotals(incomeInPeriod, "income"), [incomeInPeriod]);
  const expenseCategoryData = useMemo(() => categoryTotals(expenseInPeriod, "expense"), [expenseInPeriod]);

  const activeCategory = useMemo(() => {
    if (filters.incomeCategory) return { type: "income" as const, name: filters.incomeCategory };
    if (filters.expenseCategory) return { type: "expense" as const, name: filters.expenseCategory };
    return null;
  }, [filters.incomeCategory, filters.expenseCategory]);

  const trendData = useMemo(() => {
    if (activeCategory) {
      const source = activeCategory.type === "income" ? snapshot.income : snapshot.expenses;
      return buildCategoryMonthlySeries(source, activeCategory.name, periods);
    }
    return buildMonthlySeries(snapshot.income, snapshot.expenses, snapshot.profitGoals, periods);
  }, [activeCategory, snapshot, periods]);

  const tableTransactions = useMemo(() => {
    if (activeCategory) {
      const source = activeCategory.type === "income" ? incomeInPeriod : expenseInPeriod;
      return filterByCategory(source, activeCategory.name);
    }
    return [...incomeInPeriod, ...expenseInPeriod].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [activeCategory, incomeInPeriod, expenseInPeriod]);

  // Visit counts are monthly figures, so they are matched by the months a
  // period covers rather than by exact transaction dates.
  const visitsCurrent = useMemo(
    () => visitsInPeriods(snapshot.visits, monthKeysBetween(range.start, range.end)),
    [snapshot.visits, range]
  );
  const visitsPrevious = useMemo(
    () =>
      filters.compare === "none"
        ? []
        : visitsInPeriods(snapshot.visits, monthKeysBetween(range.prevStart, range.prevEnd)),
    [snapshot.visits, range, filters.compare]
  );

  const visitKpis = useMemo(() => buildVisitKpis(visitsCurrent, visitsPrevious), [visitsCurrent, visitsPrevious]);
  const visitTrend = useMemo(() => buildVisitMonthlySeries(snapshot.visits, periods), [snapshot.visits, periods]);
  const serviceBreakdown = useMemo(() => visitBreakdown(visitsCurrent, "service"), [visitsCurrent]);
  const staffBreakdown = useMemo(() => visitBreakdown(visitsCurrent, "staff"), [visitsCurrent]);
  const genderBreakdown = useMemo(() => visitBreakdown(visitsCurrent, "gender"), [visitsCurrent]);

  // The YoY overlay always spans whole calendar years, so it is anchored to the
  // year of the selected period rather than to the period's own length. It is
  // always rendered — year-on-year growth is a headline number here, not
  // something to go looking for in a dropdown.
  const focusYear = useMemo(() => range.end.getUTCFullYear(), [range]);

  const yoyFinance = useMemo(
    () => buildYoySeries(snapshot.income, snapshot.expenses, focusYear, "omzet"),
    [snapshot.income, snapshot.expenses, focusYear]
  );
  const yoyVisits = useMemo(
    () => buildVisitYoySeries(snapshot.visits, focusYear),
    [snapshot.visits, focusYear]
  );

  function selectIncomeCategory(category: string | null) {
    updateFilters({ incomeCategory: category, expenseCategory: null });
  }
  function selectExpenseCategory(category: string | null) {
    updateFilters({ expenseCategory: category, incomeCategory: null });
  }
  function selectView(view: DashboardView) {
    updateFilters({ view });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const isVisitView = filters.view === "kunjungan";

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader
        view={filters.view}
        periodLabel={range.label}
        userName={userName}
        onViewChange={selectView}
        onLogout={handleLogout}
        actions={<ExportMenu filters={filters} />}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Report letterhead — only rendered on the printed/PDF version. */}
        <div className="hidden print:block">
          <h1 className="text-lg font-semibold text-foreground">ZEA MEDIKA FARMA</h1>
          <p className="text-sm text-muted-foreground">
            Laporan {isVisitView ? "Kunjungan Pasien" : "Keuangan"} — Periode {range.label}
          </p>
        </div>

        {snapshot.warnings.length > 0 && (
          <div className="print-hidden rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
            {snapshot.warnings.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
        )}

        <PeriodFilter filters={filters} availableYears={availableYears} onChange={updateFilters} />

        {isVisitView ? (
          <>
            <VisitKpiCards kpis={visitKpis} />

            <VisitTrendChart data={visitTrend} />

            <YoyChart
              data={yoyVisits}
              year={focusYear}
              kind="count"
              title={`Perbandingan Tahunan (YoY) — ${focusYear} vs ${focusYear - 1}`}
              description="Jumlah kunjungan bulan per bulan, dibandingkan dengan tahun sebelumnya."
            />

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <VisitBreakdownChart
                title="Kunjungan per Jenis Layanan"
                description={`Komposisi layanan pada periode ${range.label}.`}
                data={serviceBreakdown}
              />
              <div className="flex flex-col gap-4">
                <GenderSplitCard data={genderBreakdown} />
                <VisitBreakdownChart
                  title="Performa Staf"
                  description="Jumlah pasien yang ditangani tiap staf."
                  data={staffBreakdown}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {activeCategory && (
              <div className="print-hidden flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Fokus kategori:</span>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-none text-white"
                  style={{
                    background:
                      activeCategory.type === "income"
                        ? incomeCategoryColor(activeCategory.name)
                        : expenseCategoryColor(activeCategory.name),
                  }}
                >
                  {activeCategory.name}
                  <button
                    type="button"
                    onClick={() =>
                      activeCategory.type === "income" ? selectIncomeCategory(null) : selectExpenseCategory(null)
                    }
                    aria-label="Hapus filter kategori"
                    className="ml-0.5 rounded-full hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            <KpiCards kpis={kpis} />

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <IncomeCategoryChart
                title="Omzet per Kategori"
                description="Klik kategori untuk fokus di seluruh dashboard."
                data={incomeCategoryData}
                selected={filters.incomeCategory}
                onSelect={selectIncomeCategory}
              />
              <ExpenseCategoryChart
                title="Pengeluaran per Kategori"
                description="Klik kategori untuk fokus di seluruh dashboard."
                data={expenseCategoryData}
                selected={filters.expenseCategory}
                onSelect={selectExpenseCategory}
              />
            </div>

            <TrendChart
              data={trendData}
              focusCategory={
                activeCategory
                  ? {
                      label: activeCategory.name,
                      color:
                        activeCategory.type === "income"
                          ? incomeCategoryColor(activeCategory.name)
                          : expenseCategoryColor(activeCategory.name),
                      type: activeCategory.type,
                    }
                  : null
              }
            />

            <YoyChart
              data={yoyFinance}
              year={focusYear}
              title={`Perbandingan Omzet Tahunan (YoY) — ${focusYear} vs ${focusYear - 1}`}
              description="Omzet bulan per bulan, dibandingkan dengan tahun sebelumnya."
            />

            {filters.compare !== "none" && (
              <ComparisonPanel kpis={kpis} currentLabel={range.label} previousLabel={range.prevLabel} />
            )}

            <TransactionsTable
              transactions={tableTransactions}
              title="Detail Transaksi"
              description={
                activeCategory
                  ? `Transaksi untuk kategori "${activeCategory.name}" pada periode ${range.label}.`
                  : `Semua transaksi omzet & pengeluaran pada periode ${range.label}.`
              }
            />
          </>
        )}

        <footer className="pb-4 text-center text-xs text-muted-foreground">
          Data disinkronkan dari Google Sheets, diperbarui otomatis setiap ±15 menit. Terakhir diambil:{" "}
          {new Date(snapshot.fetchedAt).toLocaleString("id-ID")}.
          {buildId && (
            // Makes it possible to tell at a glance whether a browser is still
            // showing a cached older build.
            <span className="print-hidden"> · versi {buildId}</span>
          )}
        </footer>
      </main>
    </div>
  );
}

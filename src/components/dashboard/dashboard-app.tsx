"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCards } from "./kpi-cards";
import { PeriodFilter } from "./period-filter";
import { IncomeCategoryChart, ExpenseCategoryChart } from "./category-charts";
import { TrendChart } from "./trend-chart";
import { ComparisonPanel } from "./comparison-panel";
import { TransactionsTable } from "./transactions-table";
import {
  buildCategoryMonthlySeries,
  buildKpis,
  buildMonthlySeries,
  categoryTotals,
  filterByCategory,
  getPeriodRange,
  inRange,
  periodKeysForFilters,
} from "@/lib/aggregate";
import { defaultFilters, filtersToParams, parseFilters } from "@/lib/filters";
import { incomeCategoryColor, expenseCategoryColor } from "@/lib/colors";
import type { DashboardFilters, SheetsSnapshot } from "@/types";

export function DashboardApp({ snapshot }: { snapshot: SheetsSnapshot }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallback = useMemo(() => defaultFilters([...snapshot.income, ...snapshot.expenses]), [snapshot]);
  const filters = useMemo(() => parseFilters(searchParams, fallback), [searchParams, fallback]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const t of [...snapshot.income, ...snapshot.expenses]) years.add(String(t.year));
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [snapshot]);

  const updateFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = { ...filters, ...patch };
      const params = filtersToParams(next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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

  const range = useMemo(() => getPeriodRange(filters), [filters]);

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

  const periods = useMemo(() => periodKeysForFilters(filters), [filters]);

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

  function selectIncomeCategory(category: string | null) {
    updateFilters({ incomeCategory: category, expenseCategory: null });
  }
  function selectExpenseCategory(category: string | null) {
    updateFilters({ expenseCategory: category, incomeCategory: null });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">ZEA Farma — Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitoring kunjungan &amp; omzet klinik/apotek, periode {range.label}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </header>

      {snapshot.warnings.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
          {snapshot.warnings.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}

      <PeriodFilter filters={filters} availableYears={availableYears} onChange={updateFilters} />

      {activeCategory && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Fokus kategori:</span>
          <Badge
            variant="outline"
            className="gap-1.5 border-none text-white"
            style={{
              background: activeCategory.type === "income" ? incomeCategoryColor(activeCategory.name) : expenseCategoryColor(activeCategory.name),
            }}
          >
            {activeCategory.name}
            <button
              type="button"
              onClick={() => (activeCategory.type === "income" ? selectIncomeCategory(null) : selectExpenseCategory(null))}
              aria-label="Hapus filter kategori"
              className="ml-0.5 rounded-full hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                color: activeCategory.type === "income" ? incomeCategoryColor(activeCategory.name) : expenseCategoryColor(activeCategory.name),
                type: activeCategory.type,
              }
            : null
        }
      />

      {filters.compare !== "none" && <ComparisonPanel kpis={kpis} currentLabel={range.label} previousLabel={range.prevLabel} />}

      <TransactionsTable
        transactions={tableTransactions}
        title="Detail Transaksi"
        description={
          activeCategory
            ? `Transaksi untuk kategori "${activeCategory.name}" pada periode ${range.label}.`
            : `Semua transaksi omzet & pengeluaran pada periode ${range.label}.`
        }
      />

      <footer className="pb-4 text-center text-xs text-muted-foreground">
        Data disinkronkan dari Google Sheets, diperbarui otomatis setiap ±15 menit. Terakhir diambil:{" "}
        {new Date(snapshot.fetchedAt).toLocaleString("id-ID")}.
      </footer>
    </div>
  );
}

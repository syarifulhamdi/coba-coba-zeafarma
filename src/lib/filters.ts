import type { DashboardFilters, DashboardView, PeriodMode, Transaction } from "@/types";

export function latestPeriodKey(transactions: Transaction[]): string {
  let latest = "";
  for (const t of transactions) {
    if (t.periodKey > latest) latest = t.periodKey;
  }
  return latest || new Date().toISOString().slice(0, 7);
}

export function defaultFilters(transactions: Transaction[]): DashboardFilters {
  const latest = latestPeriodKey(transactions);
  const [year] = latest.split("-");
  return {
    view: "keuangan",
    mode: "monthly",
    month: latest,
    year,
    from: `${year}-01-01`,
    to: `${latest}-01`,
    incomeCategory: null,
    expenseCategory: null,
    compare: "previous",
  };
}

const VALID_MODES: PeriodMode[] = ["monthly", "yearly", "custom"];
const VALID_VIEWS: DashboardView[] = ["keuangan", "kunjungan"];

export function parseFilters(params: URLSearchParams, fallback: DashboardFilters): DashboardFilters {
  const mode = VALID_MODES.includes(params.get("mode") as PeriodMode)
    ? (params.get("mode") as PeriodMode)
    : fallback.mode;
  const view = VALID_VIEWS.includes(params.get("view") as DashboardView)
    ? (params.get("view") as DashboardView)
    : fallback.view;

  return {
    view,
    mode,
    month: params.get("month") || fallback.month,
    year: params.get("year") || fallback.year,
    from: params.get("from") || fallback.from,
    to: params.get("to") || fallback.to,
    incomeCategory: params.get("incomeCategory") || null,
    expenseCategory: params.get("expenseCategory") || null,
    compare: params.get("compare") === "none" ? "none" : "previous",
  };
}

export function filtersToParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.view !== "keuangan") params.set("view", filters.view);
  params.set("mode", filters.mode);
  if (filters.mode === "monthly") params.set("month", filters.month);
  if (filters.mode === "yearly") params.set("year", filters.year);
  if (filters.mode === "custom") {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }
  if (filters.incomeCategory) params.set("incomeCategory", filters.incomeCategory);
  if (filters.expenseCategory) params.set("expenseCategory", filters.expenseCategory);
  if (filters.compare === "none") params.set("compare", "none");
  return params;
}

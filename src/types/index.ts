export type TransactionType = "income" | "expense";

export interface Transaction {
  type: TransactionType;
  date: string | null; // ISO date string (yyyy-MM-dd), null if unparseable
  id: string;
  description: string;
  category: string;
  amount: number;
  tax: number;
  adjustment: number; // DISC (income) or FEES (expense)
  net: number; // authoritative amount used for aggregation
  notes: string;
  month: number; // 1-12
  year: number;
  periodKey: string; // "YYYY-MM"
  rowIndex: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  color: string;
  share: number; // 0-1 fraction of the group total
}

export interface MonthlyPoint {
  periodKey: string; // "YYYY-MM"
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
  profit: number;
  target: number | null;
  focusValue?: number;
}

export interface ProfitGoals {
  // goals[year][month] = target profit (net income - net expense) for that month
  [year: number]: { [month: number]: number };
}

export interface KpiComparison {
  current: number;
  previous: number;
  deltaAbsolute: number;
  deltaPercent: number | null; // null when previous is 0 (undefined growth)
}

export interface DashboardKpis {
  omzet: KpiComparison;
  expense: KpiComparison;
  netProfit: KpiComparison;
  marginPercent: KpiComparison;
}

/**
 * The "Trafik Kunjungan" tabs group visit counts into four blocks, each a
 * label x month matrix. Rows are flattened into one record per label/month so
 * they aggregate the same way transactions do.
 */
export type VisitBlockKind = "patientType" | "service" | "staff" | "gender";

export interface VisitRecord {
  kind: VisitBlockKind;
  label: string;
  year: number;
  month: number; // 1-12
  periodKey: string; // "YYYY-MM"
  count: number;
}

export interface VisitBreakdownItem {
  label: string;
  total: number;
  color: string;
  share: number; // 0-1 fraction of the block total
}

export interface VisitMonthlyPoint {
  periodKey: string;
  label: string;
  year: number;
  month: number;
  total: number;
  baru: number;
  lama: number;
}

export interface VisitKpis {
  total: KpiComparison;
  baru: KpiComparison;
  lama: KpiComparison;
  /** Share of visits that are first-time patients, as a percentage. */
  newPatientRate: KpiComparison;
}

export interface SheetsSnapshot {
  income: Transaction[];
  expenses: Transaction[];
  profitGoals: ProfitGoals;
  visits: VisitRecord[];
  fetchedAt: string;
  warnings: string[];
}

export type PeriodMode = "monthly" | "yearly" | "custom";

export type DashboardView = "keuangan" | "kunjungan";

export interface DashboardFilters {
  view: DashboardView;
  mode: PeriodMode;
  month: string; // "YYYY-MM", used when mode === monthly
  year: string; // "YYYY", used when mode === yearly
  from: string; // ISO date, used when mode === custom
  to: string; // ISO date, used when mode === custom
  incomeCategory: string | null;
  expenseCategory: string | null;
  /**
   * "previous" = the period immediately before this one (MoM).
   * "yoy"      = the same period one year earlier.
   */
  compare: "previous" | "yoy" | "none";
}

/** One month aligned across two years, for the year-over-year overlay. */
export interface YoyPoint {
  month: number;
  label: string;
  current: number | null;
  previous: number | null;
}

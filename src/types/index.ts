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

export interface SheetsSnapshot {
  income: Transaction[];
  expenses: Transaction[];
  profitGoals: ProfitGoals;
  fetchedAt: string;
  warnings: string[];
}

export type PeriodMode = "monthly" | "yearly" | "custom";

export interface DashboardFilters {
  mode: PeriodMode;
  month: string; // "YYYY-MM", used when mode === monthly
  year: string; // "YYYY", used when mode === yearly
  from: string; // ISO date, used when mode === custom
  to: string; // ISO date, used when mode === custom
  incomeCategory: string | null;
  expenseCategory: string | null;
  compare: "previous" | "none";
}

import { incomeCategoryColor, expenseCategoryColor } from "./colors";
import { monthLabel } from "./utils";
import type {
  CategoryTotal,
  DashboardFilters,
  DashboardKpis,
  KpiComparison,
  MonthlyPoint,
  ProfitGoals,
  Transaction,
  YoyPoint,
} from "@/types";

export interface PeriodRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
  prevLabel: string;
}

function endOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function shiftYears(date: Date, delta: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear() + delta,
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

export interface PeriodRangeOptions {
  /**
   * Last month (1-12) that has data in the selected year. When a year is still
   * in progress, comparing its partial total against a full previous year
   * reads as a collapse even while the business is growing, so the comparison
   * window is trimmed to the same months on both sides and both labels say so.
   */
  lastMonthWithData?: number;
}

export function getPeriodRange(filters: DashboardFilters, options: PeriodRangeOptions = {}): PeriodRange {
  const yoy = filters.compare === "yoy";

  if (filters.mode === "yearly") {
    const year = Number(filters.year);
    const lastMonth = options.lastMonthWithData;
    const partial = typeof lastMonth === "number" && lastMonth >= 1 && lastMonth < 12;
    const throughMonth = partial ? (lastMonth as number) : 12;

    const start = startOfMonth(year, 1);
    const end = endOfMonth(year, throughMonth);
    // A calendar year's previous period already *is* the previous year, so
    // "yoy" and "previous" coincide here.
    const prevStart = startOfMonth(year - 1, 1);
    const prevEnd = endOfMonth(year - 1, throughMonth);
    const suffix = partial ? ` (${monthLabel(1)}–${monthLabel(throughMonth)})` : "";
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: `${year}${suffix}`,
      prevLabel: `${year - 1}${suffix}`,
    };
  }

  if (filters.mode === "custom") {
    const start = parseISO(filters.from);
    const end = new Date(parseISO(filters.to).getTime() + 24 * 60 * 60 * 1000 - 1);
    const prevStart = yoy ? shiftYears(start, -1) : new Date(start.getTime() - 1 - (end.getTime() - start.getTime()));
    const prevEnd = yoy ? shiftYears(end, -1) : new Date(start.getTime() - 1);
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: `${filters.from} – ${filters.to}`,
      prevLabel: `${prevStart.toISOString().slice(0, 10)} – ${prevEnd.toISOString().slice(0, 10)}`,
    };
  }

  // monthly (default)
  const [year, month] = filters.month.split("-").map(Number);
  const start = startOfMonth(year, month);
  const end = endOfMonth(year, month);
  const prevMonthDate = yoy ? new Date(Date.UTC(year - 1, month - 1, 1)) : new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevMonthDate.getUTCFullYear();
  const prevMonth = prevMonthDate.getUTCMonth() + 1;
  return {
    start,
    end,
    prevStart: startOfMonth(prevYear, prevMonth),
    prevEnd: endOfMonth(prevYear, prevMonth),
    label: `${monthLabel(month)} ${year}`,
    prevLabel: `${monthLabel(prevMonth)} ${prevYear}`,
  };
}

export function inRange(tx: Transaction, start: Date, end: Date): boolean {
  if (!tx.date) return false;
  const d = parseISO(tx.date);
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

export function filterByCategory(transactions: Transaction[], category: string | null): Transaction[] {
  if (!category) return transactions;
  return transactions.filter((t) => t.category === category);
}

export function sumNet(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + t.net, 0);
}

function comparison(current: number, previous: number): KpiComparison {
  const deltaAbsolute = current - previous;
  const deltaPercent = previous !== 0 ? (deltaAbsolute / Math.abs(previous)) * 100 : null;
  return { current, previous, deltaAbsolute, deltaPercent };
}

export function buildKpis(
  incomeCurrent: Transaction[],
  incomePrevious: Transaction[],
  expenseCurrent: Transaction[],
  expensePrevious: Transaction[]
): DashboardKpis {
  const omzetCur = sumNet(incomeCurrent);
  const omzetPrev = sumNet(incomePrevious);
  const expenseCur = sumNet(expenseCurrent);
  const expensePrev = sumNet(expensePrevious);
  const profitCur = omzetCur - expenseCur;
  const profitPrev = omzetPrev - expensePrev;
  const marginCur = omzetCur !== 0 ? (profitCur / omzetCur) * 100 : 0;
  const marginPrev = omzetPrev !== 0 ? (profitPrev / omzetPrev) * 100 : 0;

  return {
    omzet: comparison(omzetCur, omzetPrev),
    expense: comparison(expenseCur, expensePrev),
    netProfit: comparison(profitCur, profitPrev),
    marginPercent: comparison(marginCur, marginPrev),
  };
}

export function categoryTotals(transactions: Transaction[], type: "income" | "expense"): CategoryTotal[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    const entry = totals.get(t.category) ?? { total: 0, count: 0 };
    entry.total += t.net;
    entry.count += 1;
    totals.set(t.category, entry);
  }
  const grandTotal = [...totals.values()].reduce((acc, v) => acc + v.total, 0);
  const colorFn = type === "income" ? incomeCategoryColor : expenseCategoryColor;

  return [...totals.entries()]
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      color: colorFn(category),
      share: grandTotal !== 0 ? total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function monthsBetween(start: Date, end: Date): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor.getTime() <= endCursor.getTime()) {
    result.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return result;
}

/**
 * The last month of `year` that has any data at all, across transactions and
 * visit records. Returns null when the year has no data.
 */
export function lastMonthWithData(
  year: number,
  transactions: Transaction[],
  visitPeriodKeys: string[] = []
): number | null {
  let last = 0;
  for (const t of transactions) {
    if (t.year === year && t.month > last) last = t.month;
  }
  for (const key of visitPeriodKeys) {
    const [y, m] = key.split("-").map(Number);
    if (y === year && m > last) last = m;
  }
  return last > 0 ? last : null;
}

export function periodKeysForFilters(filters: DashboardFilters): { year: number; month: number }[] {
  if (filters.mode === "yearly") {
    const year = Number(filters.year);
    return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
  }
  if (filters.mode === "custom") {
    return monthsBetween(parseISO(filters.from), parseISO(filters.to));
  }
  const [year, month] = filters.month.split("-").map(Number);
  const end = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(Date.UTC(year, month - 12, 1));
  return monthsBetween(start, end);
}

export function buildMonthlySeries(
  income: Transaction[],
  expenses: Transaction[],
  profitGoals: ProfitGoals,
  periods: { year: number; month: number }[]
): MonthlyPoint[] {
  const incomeByPeriod = groupByPeriod(income);
  const expenseByPeriod = groupByPeriod(expenses);

  return periods.map(({ year, month }) => {
    const periodKey = `${year}-${String(month).padStart(2, "0")}`;
    const incomeTotal = sumNet(incomeByPeriod.get(periodKey) ?? []);
    const expenseTotal = sumNet(expenseByPeriod.get(periodKey) ?? []);
    return {
      periodKey,
      label: `${monthLabel(month)} ${String(year).slice(2)}`,
      year,
      month,
      income: incomeTotal,
      expense: expenseTotal,
      profit: incomeTotal - expenseTotal,
      target: profitGoals[year]?.[month] ?? null,
    };
  });
}

export function buildCategoryMonthlySeries(
  transactions: Transaction[],
  category: string,
  periods: { year: number; month: number }[]
): MonthlyPoint[] {
  const byPeriod = groupByPeriod(transactions.filter((t) => t.category === category));
  return periods.map(({ year, month }) => {
    const periodKey = `${year}-${String(month).padStart(2, "0")}`;
    const value = sumNet(byPeriod.get(periodKey) ?? []);
    return {
      periodKey,
      label: `${monthLabel(month)} ${String(year).slice(2)}`,
      year,
      month,
      income: 0,
      expense: 0,
      profit: 0,
      target: null,
      focusValue: value,
    };
  });
}

export type YoyMetric = "omzet" | "expense" | "profit";

/**
 * Lines up two calendar years month by month. Months that have not happened
 * yet come back as null rather than 0 so the line stops instead of diving to
 * the axis — a partial year would otherwise read as a collapse.
 */
export function buildYoySeries(
  income: Transaction[],
  expenses: Transaction[],
  year: number,
  metric: YoyMetric
): YoyPoint[] {
  const incomeByPeriod = groupByPeriod(income);
  const expenseByPeriod = groupByPeriod(expenses);

  const valueFor = (y: number, m: number): number | null => {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const incomeRows = incomeByPeriod.get(key);
    const expenseRows = expenseByPeriod.get(key);
    if (!incomeRows && !expenseRows) return null;
    const omzet = sumNet(incomeRows ?? []);
    const expense = sumNet(expenseRows ?? []);
    if (metric === "omzet") return omzet;
    if (metric === "expense") return expense;
    return omzet - expense;
  };

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      month,
      label: monthLabel(month),
      current: valueFor(year, month),
      previous: valueFor(year - 1, month),
    };
  });
}

function groupByPeriod(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const arr = map.get(t.periodKey) ?? [];
    arr.push(t);
    map.set(t.periodKey, arr);
  }
  return map;
}

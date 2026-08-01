import { unstable_cache } from "next/cache";
import { fetchSheetGrid, SHEET_TABS } from "./google-sheets";
import { parseProfitGoals, parseTransactionSheet } from "./parse-sheets";
import type { SheetsSnapshot } from "@/types";

const REVALIDATE_SECONDS = 15 * 60;

async function loadSnapshot(): Promise<SheetsSnapshot> {
  const warnings: string[] = [];

  const [incomeGrid, expensesGrid, setupGrid] = await Promise.all([
    fetchSheetGrid(SHEET_TABS.income),
    fetchSheetGrid(SHEET_TABS.expenses),
    fetchSheetGrid(SHEET_TABS.setup).catch(() => {
      warnings.push(`Could not read the "${SHEET_TABS.setup}" sheet; profit targets will be unavailable.`);
      return [] as unknown[][];
    }),
  ]);

  const income = parseTransactionSheet(incomeGrid, "income");
  const expenses = parseTransactionSheet(expensesGrid, "expense");
  const profitGoals = parseProfitGoals(setupGrid);

  if (income.warning) warnings.push(income.warning);
  if (expenses.warning) warnings.push(expenses.warning);
  if (profitGoals.warning) warnings.push(profitGoals.warning);

  return {
    income: income.transactions,
    expenses: expenses.transactions,
    profitGoals: profitGoals.goals,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}

const getCachedSnapshot = unstable_cache(loadSnapshot, ["sheets-snapshot"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["sheets-snapshot"],
});

export async function getSnapshot(): Promise<SheetsSnapshot> {
  return getCachedSnapshot();
}

import { unstable_cache } from "next/cache";
import { fetchSheetGrid, listSheetTitles, SHEET_TABS } from "./google-sheets";
import { parseProfitGoals, parseTransactionSheet } from "./parse-sheets";
import { parseVisitSheet, resolveVisitTabYears } from "./parse-visits";
import type { SheetsSnapshot, VisitRecord } from "@/types";

const REVALIDATE_SECONDS = 15 * 60;

async function loadVisits(warnings: string[]): Promise<VisitRecord[]> {
  const titles = await listSheetTitles();
  const tabs = resolveVisitTabYears(titles);
  if (tabs.length === 0) {
    warnings.push('Tidak ditemukan tab "Trafik Kunjungan"; dashboard kunjungan pasien akan kosong.');
    return [];
  }

  const grids = await Promise.all(
    tabs.map(({ tab }) =>
      fetchSheetGrid(tab, "A1:Z200").catch(() => {
        warnings.push(`Gagal membaca tab "${tab}".`);
        return [] as unknown[][];
      })
    )
  );

  const records: VisitRecord[] = [];
  grids.forEach((grid, i) => {
    if (grid.length === 0) return;
    const parsed = parseVisitSheet(grid, tabs[i].year);
    if (parsed.warning) warnings.push(parsed.warning);
    records.push(...parsed.records);
  });
  return records;
}

async function loadSnapshot(): Promise<SheetsSnapshot> {
  const warnings: string[] = [];

  const [incomeGrid, expensesGrid, setupGrid, visits] = await Promise.all([
    fetchSheetGrid(SHEET_TABS.income),
    fetchSheetGrid(SHEET_TABS.expenses),
    fetchSheetGrid(SHEET_TABS.setup).catch(() => {
      warnings.push(`Could not read the "${SHEET_TABS.setup}" sheet; profit targets will be unavailable.`);
      return [] as unknown[][];
    }),
    loadVisits(warnings).catch(() => {
      warnings.push("Gagal membaca data kunjungan pasien.");
      return [] as VisitRecord[];
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
    visits,
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

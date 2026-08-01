import type { ProfitGoals, Transaction, TransactionType } from "@/types";
import type { SheetGrid } from "./google-sheets";

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function cellNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function monthNameToNumber(text: string): number | null {
  const key = text.trim().toLowerCase();
  return MONTH_NAMES[key] ?? null;
}

function parseDateCell(value: unknown, fallbackMonth: number | null, fallbackYear: number | null): string | null {
  const text = cellText(value);
  if (text) {
    // Try "30 Jan 2025" / "30 January 2025"
    const match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = monthNameToNumber(match[2]);
      const year = Number(match[3]);
      if (month) return isoDate(year, month, day);
    }
    // Try ISO-ish "2025-01-30" or "2025/01/30"
    const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (iso) {
      return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    }
    // Try "1/30/2025" (US) or "30/1/2025" (day-first)
    const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      const a = Number(slash[1]);
      const b = Number(slash[2]);
      const year = Number(slash[3]);
      // Heuristic: if first segment > 12 it must be day-first.
      const month = a > 12 ? b : a;
      const day = a > 12 ? a : b;
      if (month >= 1 && month <= 12) return isoDate(year, month, day);
    }
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return isoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
  }
  if (fallbackYear && fallbackMonth) {
    return isoDate(fallbackYear, fallbackMonth, 1);
  }
  return null;
}

function isoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

interface ColumnMap {
  date: number;
  id: number;
  description: number;
  category: number;
  amount: number;
  tax: number;
  adjustment: number;
  net: number;
  notes: number;
  month: number;
  year: number;
}

function findHeaderRow(grid: SheetGrid): { rowIndex: number; columns: ColumnMap } | null {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const upper = row.map((c) => cellText(c).toUpperCase());
    const dateIdx = upper.indexOf("DATE");
    const categoryIdx = upper.indexOf("CATEGORY");
    if (dateIdx === -1 || categoryIdx === -1) continue;

    const find = (pred: (h: string) => boolean) => upper.findIndex(pred);
    const columns: ColumnMap = {
      date: dateIdx,
      id: upper.indexOf("ID"),
      description: find((h) => h.includes("PRODUCT") || h.includes("ITEM")),
      category: categoryIdx,
      amount: upper.indexOf("AMOUNT"),
      tax: upper.indexOf("TAX"),
      adjustment: find((h) => h.includes("DISC") || h.includes("FEE")),
      net: find((h) => h.startsWith("NET")),
      notes: upper.indexOf("NOTES"),
      month: upper.indexOf("M"),
      year: upper.findIndex((h) => h === "Y"),
    };
    return { rowIndex: r, columns };
  }
  return null;
}

export function parseTransactionSheet(grid: SheetGrid, type: TransactionType): { transactions: Transaction[]; warning: string | null } {
  const header = findHeaderRow(grid);
  if (!header) {
    return {
      transactions: [],
      warning: `Could not find a header row with DATE/CATEGORY columns in the "${type}" sheet.`,
    };
  }
  const { rowIndex, columns } = header;
  const transactions: Transaction[] = [];

  for (let r = rowIndex + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const category = cellText(row[columns.category]);
    const netRaw = columns.net >= 0 ? row[columns.net] : undefined;
    const amountRaw = columns.amount >= 0 ? row[columns.amount] : undefined;
    const hasNet = netRaw !== undefined && netRaw !== "";
    const hasAmount = amountRaw !== undefined && amountRaw !== "";
    if (!category && !hasNet && !hasAmount) continue; // blank spacer row
    if (!category) continue; // no category means it's not a real transaction row

    const monthText = columns.month >= 0 ? cellText(row[columns.month]) : "";
    const yearText = columns.year >= 0 ? cellText(row[columns.year]) : "";
    const monthFromCol = monthNameToNumber(monthText);
    const yearFromCol = yearText ? Number(yearText) : null;

    const date = parseDateCell(columns.date >= 0 ? row[columns.date] : undefined, monthFromCol, yearFromCol);

    let month = monthFromCol;
    let year = yearFromCol && Number.isFinite(yearFromCol) ? yearFromCol : null;
    if ((!month || !year) && date) {
      const [y, m] = date.split("-");
      year = year ?? Number(y);
      month = month ?? Number(m);
    }
    if (!month || !year) continue; // can't place this row on the timeline, skip

    const amount = hasAmount ? cellNumber(amountRaw) : 0;
    const net = hasNet ? cellNumber(netRaw) : amount;

    transactions.push({
      type,
      date,
      id: columns.id >= 0 ? cellText(row[columns.id]) : "",
      description: columns.description >= 0 ? cellText(row[columns.description]) : "",
      category,
      amount,
      tax: columns.tax >= 0 ? cellNumber(row[columns.tax]) : 0,
      adjustment: columns.adjustment >= 0 ? cellNumber(row[columns.adjustment]) : 0,
      net,
      notes: columns.notes >= 0 ? cellText(row[columns.notes]) : "",
      month,
      year,
      periodKey: `${year}-${String(month).padStart(2, "0")}`,
      rowIndex: r,
    });
  }

  return { transactions, warning: null };
}

/**
 * The "Setup" tab lays profit goals out as a merged-cell grid: a row with
 * "Calendar Year" followed by one column per year, then twelve month rows
 * below it where each year's column pair holds a "Rp" label and the target
 * value. Rather than hardcode column letters (fragile against any manual
 * edits to the sheet), this scans for the year header row, maps each year to
 * its value column, then scans down for month-name rows.
 */
export function parseProfitGoals(grid: SheetGrid): { goals: ProfitGoals; warning: string | null } {
  const goals: ProfitGoals = {};

  let yearHeaderRow = -1;
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] ?? [];
    if (row.some((c) => cellText(c).toLowerCase() === "calendar year")) {
      yearHeaderRow = r;
      break;
    }
  }
  if (yearHeaderRow === -1) {
    return { goals, warning: 'Could not find "Calendar Year" header in the Setup sheet; monthly profit targets will be unavailable.' };
  }

  const headerRow = grid[yearHeaderRow] ?? [];
  const yearColumns: { year: number; col: number }[] = [];
  for (let c = 0; c < headerRow.length; c++) {
    const raw = headerRow[c];
    const n = typeof raw === "number" ? raw : Number(cellText(raw));
    if (Number.isInteger(n) && n >= 2000 && n <= 2100) {
      yearColumns.push({ year: n, col: c });
    }
  }
  if (yearColumns.length === 0) {
    return { goals, warning: "Found the Setup profit-goals header but no year columns beneath it." };
  }

  let matched = 0;
  for (let r = yearHeaderRow + 1; r < grid.length && matched < 12; r++) {
    const row = grid[r] ?? [];
    let monthNum: number | null = null;
    for (let c = 0; c < Math.min(row.length, 4); c++) {
      monthNum = monthNameToNumber(cellText(row[c]));
      if (monthNum) break;
    }
    if (!monthNum) continue;
    matched++;
    for (const { year, col } of yearColumns) {
      const valueCell = row[col + 1];
      const value = typeof valueCell === "number" ? valueCell : Number(cellText(valueCell).replace(/[^0-9.\-]/g, ""));
      if (Number.isFinite(value) && value > 0) {
        goals[year] = goals[year] ?? {};
        goals[year][monthNum] = value;
      }
    }
  }

  return { goals, warning: null };
}

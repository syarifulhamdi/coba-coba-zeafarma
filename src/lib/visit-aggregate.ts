import { visitPairColor, visitServiceColor, visitStaffColor } from "./colors";
import { monthLabel } from "./utils";
import type {
  KpiComparison,
  VisitBlockKind,
  VisitBreakdownItem,
  VisitKpis,
  VisitMonthlyPoint,
  VisitRecord,
  YoyPoint,
} from "@/types";

/**
 * Visit counts are recorded per month, so a period is matched by its month
 * keys rather than by exact dates. A custom range therefore covers every month
 * it touches, even partially.
 */
export function monthKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor.getTime() <= last.getTime()) {
    keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return keys;
}

export function visitsInPeriods(records: VisitRecord[], periodKeys: string[]): VisitRecord[] {
  const set = new Set(periodKeys);
  return records.filter((r) => set.has(r.periodKey));
}

function sumCount(records: VisitRecord[]): number {
  return records.reduce((acc, r) => acc + r.count, 0);
}

function ofKind(records: VisitRecord[], kind: VisitBlockKind): VisitRecord[] {
  return records.filter((r) => r.kind === kind);
}

function matchingLabel(records: VisitRecord[], pattern: RegExp): VisitRecord[] {
  return records.filter((r) => pattern.test(r.label));
}

function comparison(current: number, previous: number): KpiComparison {
  const deltaAbsolute = current - previous;
  const deltaPercent = previous !== 0 ? (deltaAbsolute / Math.abs(previous)) * 100 : null;
  return { current, previous, deltaAbsolute, deltaPercent };
}

export function buildVisitKpis(current: VisitRecord[], previous: VisitRecord[]): VisitKpis {
  // "Pasien Baru"/"Pasien Lama" is the block the sheet's own TOTAL KUNJUNGAN
  // figure is built from, so it's the authoritative total here — the service
  // and staff blocks disagree slightly in the source data.
  const curType = ofKind(current, "patientType");
  const prevType = ofKind(previous, "patientType");

  const curBaru = sumCount(matchingLabel(curType, /baru/i));
  const prevBaru = sumCount(matchingLabel(prevType, /baru/i));
  const curLama = sumCount(matchingLabel(curType, /lama/i));
  const prevLama = sumCount(matchingLabel(prevType, /lama/i));

  const curTotal = curBaru + curLama;
  const prevTotal = prevBaru + prevLama;

  return {
    total: comparison(curTotal, prevTotal),
    baru: comparison(curBaru, prevBaru),
    lama: comparison(curLama, prevLama),
    newPatientRate: comparison(
      curTotal > 0 ? (curBaru / curTotal) * 100 : 0,
      prevTotal > 0 ? (prevBaru / prevTotal) * 100 : 0
    ),
  };
}

export function visitBreakdown(records: VisitRecord[], kind: VisitBlockKind): VisitBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const r of ofKind(records, kind)) {
    totals.set(r.label, (totals.get(r.label) ?? 0) + r.count);
  }
  const grandTotal = [...totals.values()].reduce((acc, v) => acc + v, 0);

  const colorFn =
    kind === "service" ? visitServiceColor : kind === "staff" ? visitStaffColor : visitPairColor;

  return [...totals.entries()]
    .map(([label, total]) => ({
      label,
      total,
      color: colorFn(label),
      share: grandTotal !== 0 ? total / grandTotal : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function buildVisitMonthlySeries(
  records: VisitRecord[],
  periods: { year: number; month: number }[]
): VisitMonthlyPoint[] {
  const byPeriod = new Map<string, VisitRecord[]>();
  for (const r of ofKind(records, "patientType")) {
    const arr = byPeriod.get(r.periodKey) ?? [];
    arr.push(r);
    byPeriod.set(r.periodKey, arr);
  }

  return periods.map(({ year, month }) => {
    const periodKey = `${year}-${String(month).padStart(2, "0")}`;
    const rows = byPeriod.get(periodKey) ?? [];
    const baru = sumCount(matchingLabel(rows, /baru/i));
    const lama = sumCount(matchingLabel(rows, /lama/i));
    return {
      periodKey,
      label: `${monthLabel(month)} ${String(year).slice(2)}`,
      year,
      month,
      total: baru + lama,
      baru,
      lama,
    };
  });
}

/**
 * Visit totals for two calendar years, aligned by month. Months with no rows
 * at all stay null so an unfinished year does not draw a line down to zero.
 */
export function buildVisitYoySeries(records: VisitRecord[], year: number): YoyPoint[] {
  const byPeriod = new Map<string, number>();
  for (const r of ofKind(records, "patientType")) {
    byPeriod.set(r.periodKey, (byPeriod.get(r.periodKey) ?? 0) + r.count);
  }

  const valueFor = (y: number, m: number): number | null => {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    return byPeriod.has(key) ? (byPeriod.get(key) as number) : null;
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

export function visitYears(records: VisitRecord[]): string[] {
  const years = new Set<string>();
  for (const r of records) years.add(String(r.year));
  return [...years].sort((a, b) => Number(b) - Number(a));
}

import type { VisitBlockKind, VisitRecord } from "@/types";
import type { SheetGrid } from "./google-sheets";

/**
 * Column layout of every block in a "Trafik Kunjungan" tab:
 * col 0 = row label, col 1 = TOTAL, cols 2..13 = JAN..DES.
 *
 * Anything past column 13 is ignored on purpose: some rows carry stray values
 * further right (a neighbouring block's totals spilling into the same row),
 * and reading those would invent thirteenth and fourteenth months.
 */
const FIRST_MONTH_COL = 2;
const LAST_MONTH_COL = 13;

const MONTH_HEADERS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGT", "SEP", "OKT", "NOV", "DES"];

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

/**
 * Visit cells are counts, not currency. A blank or "-" means the month has no
 * data at all (staff not hired yet, month not reached), which is different
 * from a real recorded 0 — so those return null and get skipped entirely
 * rather than pulling an average down.
 */
function countCell(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (text === "" || text === "-" || text === "–") return null;
  const n = Number(text.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function isTotalLabel(label: string): boolean {
  return label.trim().toUpperCase() === "TOTAL";
}

function isMonthHeaderRow(row: unknown[]): boolean {
  const first = cellText(row[FIRST_MONTH_COL]).toUpperCase();
  const second = cellText(row[FIRST_MONTH_COL + 1]).toUpperCase();
  return first.startsWith("JAN") && second.startsWith("FEB");
}

/**
 * Blocks are identified by their header cell rather than by row position, so
 * inserting or moving a block in the sheet doesn't break parsing. "CATEGORY"
 * heads two different blocks (new/returning patients and gender), so that one
 * is disambiguated by looking at the labels underneath it.
 */
function blockKindFor(headerLabel: string, dataLabels: string[]): VisitBlockKind | null {
  const header = headerLabel.trim().toUpperCase();
  if (header.includes("LAYANAN")) return "service";
  if (header.includes("STAF")) return "staff";
  if (header.includes("CATEGORY") || header.includes("KATEGORI")) {
    const looksLikeGender = dataLabels.some((l) => /laki|perempuan|pria|wanita/i.test(l));
    return looksLikeGender ? "gender" : "patientType";
  }
  return null;
}

export function parseVisitSheet(grid: SheetGrid, year: number): { records: VisitRecord[]; warning: string | null } {
  const records: VisitRecord[] = [];
  let blocksFound = 0;

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] ?? [];
    if (!isMonthHeaderRow(row)) continue;

    const headerLabel = cellText(row[0]);

    const dataRows: { label: string; row: unknown[] }[] = [];
    for (let d = r + 1; d < grid.length; d++) {
      const candidate = grid[d] ?? [];
      const label = cellText(candidate[0]);
      if (isTotalLabel(label)) break; // block footer — the per-label rows above already cover it
      if (!label) {
        // A blank label ends the block, unless the row is entirely empty padding
        // inside it (which the sheet does not currently use, but is harmless).
        const hasAnyValue = candidate.slice(FIRST_MONTH_COL, LAST_MONTH_COL + 1).some((c) => countCell(c) !== null);
        if (!hasAnyValue) break;
        continue;
      }
      if (isMonthHeaderRow(candidate)) break; // next block started without a TOTAL row
      dataRows.push({ label, row: candidate });
    }

    const kind = blockKindFor(
      headerLabel,
      dataRows.map((d) => d.label)
    );
    if (!kind) continue;
    blocksFound++;

    for (const { label, row: dataRow } of dataRows) {
      for (let c = FIRST_MONTH_COL; c <= LAST_MONTH_COL; c++) {
        const count = countCell(dataRow[c]);
        if (count === null) continue;
        const month = c - FIRST_MONTH_COL + 1;
        records.push({
          kind,
          label,
          year,
          month,
          periodKey: `${year}-${String(month).padStart(2, "0")}`,
          count,
        });
      }
    }

    r += dataRows.length; // skip past the rows just consumed
  }

  if (blocksFound === 0) {
    return {
      records,
      warning: `Tab kunjungan ${year} tidak memiliki blok yang dikenali (dicari baris header dengan kolom ${MONTH_HEADERS[0]}..${MONTH_HEADERS[11]}).`,
    };
  }

  return { records, warning: null };
}

/**
 * Works out which calendar year each "Trafik Kunjungan" tab holds. Tabs are
 * named with an explicit year once a second year exists ("Trafik Kunjungan
 * 2026"), while the original tab kept its bare name — so a bare tab is taken
 * to be the year before the earliest explicitly named one.
 */
export function resolveVisitTabYears(tabTitles: string[]): { tab: string; year: number }[] {
  const matching = tabTitles.filter((t) => /trafik\s*kunjungan/i.test(t));
  if (matching.length === 0) return [];

  const withYear: { tab: string; year: number }[] = [];
  const withoutYear: string[] = [];

  for (const tab of matching) {
    const match = tab.match(/(20\d{2})/);
    if (match) withYear.push({ tab, year: Number(match[1]) });
    else withoutYear.push(tab);
  }

  const earliest = withYear.length > 0 ? Math.min(...withYear.map((t) => t.year)) : new Date().getUTCFullYear() + 1;

  withoutYear.forEach((tab, i) => {
    withYear.push({ tab, year: earliest - 1 - i });
  });

  return withYear.sort((a, b) => a.year - b.year);
}

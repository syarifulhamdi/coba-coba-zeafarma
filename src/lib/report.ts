import { buildKpis, categoryTotals, getPeriodRange, inRange } from "./aggregate";
import { buildVisitKpis, monthKeysBetween, visitBreakdown, visitsInPeriods } from "./visit-aggregate";
import type { DashboardFilters, SheetsSnapshot } from "@/types";

export interface ReportSection {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface MonthlyReport {
  periodLabel: string;
  previousLabel: string;
  generatedAt: string;
  sections: ReportSection[];
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function buildMonthlyReport(snapshot: SheetsSnapshot, filters: DashboardFilters): MonthlyReport {
  const range = getPeriodRange(filters);

  const incomeCur = snapshot.income.filter((t) => inRange(t, range.start, range.end));
  const incomePrev = snapshot.income.filter((t) => inRange(t, range.prevStart, range.prevEnd));
  const expenseCur = snapshot.expenses.filter((t) => inRange(t, range.start, range.end));
  const expensePrev = snapshot.expenses.filter((t) => inRange(t, range.prevStart, range.prevEnd));
  const kpis = buildKpis(incomeCur, incomePrev, expenseCur, expensePrev);

  const visitsCur = visitsInPeriods(snapshot.visits, monthKeysBetween(range.start, range.end));
  const visitsPrev = visitsInPeriods(snapshot.visits, monthKeysBetween(range.prevStart, range.prevEnd));
  const visitKpis = buildVisitKpis(visitsCur, visitsPrev);

  const sections: ReportSection[] = [
    {
      heading: "Ringkasan Keuangan",
      columns: ["Metrik", "Periode ini", "Periode lalu", "Selisih", "Perubahan"],
      rows: [
        ["Total Omzet", kpis.omzet.current, kpis.omzet.previous, kpis.omzet.deltaAbsolute, kpis.omzet.deltaPercent === null ? "-" : percent(kpis.omzet.deltaPercent)],
        ["Total Pengeluaran", kpis.expense.current, kpis.expense.previous, kpis.expense.deltaAbsolute, kpis.expense.deltaPercent === null ? "-" : percent(kpis.expense.deltaPercent)],
        ["Net Profit", kpis.netProfit.current, kpis.netProfit.previous, kpis.netProfit.deltaAbsolute, kpis.netProfit.deltaPercent === null ? "-" : percent(kpis.netProfit.deltaPercent)],
        ["Margin (%)", percent(kpis.marginPercent.current), percent(kpis.marginPercent.previous), percent(kpis.marginPercent.deltaAbsolute), kpis.marginPercent.deltaPercent === null ? "-" : percent(kpis.marginPercent.deltaPercent)],
      ],
    },
    {
      heading: "Omzet per Kategori",
      columns: ["Kategori", "Nilai", "Porsi", "Jumlah transaksi"],
      rows: categoryTotals(incomeCur, "income").map((c) => [c.category, c.total, percent(c.share * 100), c.count]),
    },
    {
      heading: "Pengeluaran per Kategori",
      columns: ["Kategori", "Nilai", "Porsi", "Jumlah transaksi"],
      rows: categoryTotals(expenseCur, "expense").map((c) => [c.category, c.total, percent(c.share * 100), c.count]),
    },
    {
      heading: "Ringkasan Kunjungan Pasien",
      columns: ["Metrik", "Periode ini", "Periode lalu", "Selisih", "Perubahan"],
      rows: [
        ["Total Kunjungan", visitKpis.total.current, visitKpis.total.previous, visitKpis.total.deltaAbsolute, visitKpis.total.deltaPercent === null ? "-" : percent(visitKpis.total.deltaPercent)],
        ["Pasien Baru", visitKpis.baru.current, visitKpis.baru.previous, visitKpis.baru.deltaAbsolute, visitKpis.baru.deltaPercent === null ? "-" : percent(visitKpis.baru.deltaPercent)],
        ["Pasien Lama", visitKpis.lama.current, visitKpis.lama.previous, visitKpis.lama.deltaAbsolute, visitKpis.lama.deltaPercent === null ? "-" : percent(visitKpis.lama.deltaPercent)],
        ["Porsi Pasien Baru (%)", percent(visitKpis.newPatientRate.current), percent(visitKpis.newPatientRate.previous), percent(visitKpis.newPatientRate.deltaAbsolute), visitKpis.newPatientRate.deltaPercent === null ? "-" : percent(visitKpis.newPatientRate.deltaPercent)],
      ],
    },
    {
      heading: "Kunjungan per Jenis Layanan",
      columns: ["Layanan", "Jumlah", "Porsi"],
      rows: visitBreakdown(visitsCur, "service").map((v) => [v.label, v.total, percent(v.share * 100)]),
    },
    {
      heading: "Kunjungan per Staf",
      columns: ["Nama Staf", "Jumlah", "Porsi"],
      rows: visitBreakdown(visitsCur, "staff").map((v) => [v.label, v.total, percent(v.share * 100)]),
    },
    {
      heading: "Komposisi Gender",
      columns: ["Gender", "Jumlah", "Porsi"],
      rows: visitBreakdown(visitsCur, "gender").map((v) => [v.label, v.total, percent(v.share * 100)]),
    },
    {
      heading: "Detail Transaksi",
      columns: ["Tanggal", "Jenis", "Kategori", "Deskripsi", "Nilai Net"],
      rows: [...incomeCur, ...expenseCur]
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
        .map((t) => [t.date ?? "-", t.type === "income" ? "Omzet" : "Pengeluaran", t.category, t.description, t.net]),
    },
  ];

  return {
    periodLabel: range.label,
    previousLabel: range.prevLabel,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

/**
 * Semicolon-delimited with a UTF-8 BOM: that is the combination Excel opens
 * correctly in an id-ID locale, where a comma is the decimal separator and a
 * BOM-less file mangles accented characters.
 */
export function reportToCsv(report: MonthlyReport): string {
  const escape = (value: string | number): string => {
    const text = String(value ?? "");
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines: string[] = [
    escape("ZEA MEDIKA FARMA — Laporan Periode"),
    `${escape("Periode")};${escape(report.periodLabel)}`,
    `${escape("Pembanding")};${escape(report.previousLabel)}`,
    `${escape("Dibuat")};${escape(new Date(report.generatedAt).toLocaleString("id-ID"))}`,
  ];

  for (const section of report.sections) {
    lines.push("");
    lines.push(escape(section.heading));
    lines.push(section.columns.map(escape).join(";"));
    if (section.rows.length === 0) {
      lines.push(escape("(tidak ada data)"));
      continue;
    }
    for (const row of section.rows) {
      lines.push(row.map(escape).join(";"));
    }
  }

  return "﻿" + lines.join("\r\n");
}

export function reportFileName(periodLabel: string): string {
  const slug = periodLabel.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
  return `laporan-zea-farma-${slug || "periode"}.csv`;
}

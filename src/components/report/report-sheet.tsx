"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { SEMANTIC_COLORS, VISIT_PAIR_COLORS } from "@/lib/colors";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";
import type {
  CategoryTotal,
  DashboardKpis,
  KpiComparison,
  MonthlyPoint,
  VisitBreakdownItem,
  VisitKpis,
  VisitMonthlyPoint,
} from "@/types";

export interface ReportData {
  periodLabel: string;
  previousLabel: string;
  compareLabel: string;
  generatedAt: string;
  kpis: DashboardKpis;
  visitKpis: VisitKpis;
  trend: MonthlyPoint[];
  visitTrend: VisitMonthlyPoint[];
  incomeCategories: CategoryTotal[];
  expenseCategories: CategoryTotal[];
  services: VisitBreakdownItem[];
  staff: VisitBreakdownItem[];
  gender: VisitBreakdownItem[];
  hasVisitData: boolean;
}

const NAVY = "#0d4a7d";

// Chart column is 108mm wide; at the CSS reference of 96dpi that is 408px.
// Fixed rather than responsive on purpose — see the chart call sites.
const CHART_W = 408;

/* ---------- small building blocks ---------- */

function DeltaText({ comparison, invert = false }: { comparison: KpiComparison; invert?: boolean }) {
  if (comparison.deltaPercent === null) return <span className="text-[6.5pt] text-slate-400">—</span>;
  const positive = invert ? comparison.deltaPercent <= 0 : comparison.deltaPercent >= 0;
  return (
    <span className={`text-[6.5pt] font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {formatPercent(comparison.deltaPercent)}
    </span>
  );
}

function Metric({
  label,
  value,
  comparison,
  invert,
  accent,
}: {
  label: string;
  value: string;
  comparison: KpiComparison;
  invert?: boolean;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-2.5 py-2">
      <span className="absolute inset-y-0 left-0 w-[2.5px]" style={{ background: accent }} />
      <p className="pl-1 text-[6pt] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 pl-1 text-[11pt] font-semibold leading-none tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 pl-1 leading-none">
        <DeltaText comparison={comparison} invert={invert} />
      </p>
    </div>
  );
}

/** Band that opens each half of the report, so the two domains never blur together. */
function SectionBand({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-md px-2.5 py-1.5" style={{ background: NAVY }}>
      <h2 className="text-[8pt] font-bold uppercase tracking-[0.12em] text-white">{title}</h2>
      <span className="text-[6.5pt] text-white/70">{subtitle}</span>
    </div>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 text-[6.5pt] font-bold uppercase tracking-wide text-slate-500">{children}</h3>
  );
}

function RankedList({
  items,
  format,
  max = 5,
  emptyLabel = "Tidak ada data",
}: {
  items: { label: string; total: number; color: string; share: number }[];
  format: (v: number) => string;
  max?: number;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="py-1 text-[7pt] italic text-slate-400">{emptyLabel}</p>;
  }
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  const restTotal = rest.reduce((a, i) => a + i.total, 0);
  const restShare = rest.reduce((a, i) => a + i.share, 0);
  const top = Math.max(...items.map((i) => i.total), 1);

  return (
    <div className="flex flex-col gap-[3px]">
      {shown.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="w-[104px] shrink-0 truncate text-[6.5pt] text-slate-700" title={item.label}>
            {item.label}
          </span>
          {/* Proportional bar: reads as a mix at a glance, not just a column of numbers. */}
          <span className="relative h-[9px] flex-1 overflow-hidden rounded-[2px] bg-slate-100">
            <span
              className="absolute inset-y-0 left-0 rounded-[2px]"
              style={{ width: `${Math.max(2, (item.total / top) * 100)}%`, background: item.color }}
            />
          </span>
          <span className="w-[46px] shrink-0 text-right text-[6.5pt] font-semibold tabular-nums text-slate-900">
            {format(item.total)}
          </span>
          <span className="w-[22px] shrink-0 text-right text-[6pt] tabular-nums text-slate-400">
            {(item.share * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {rest.length > 0 && (
        <div className="flex items-center gap-1.5 pt-[1px]">
          <span className="w-[104px] shrink-0 truncate text-[6.5pt] italic text-slate-400">
            Lainnya ({rest.length})
          </span>
          <span className="h-[9px] flex-1" />
          <span className="w-[46px] shrink-0 text-right text-[6.5pt] tabular-nums text-slate-500">
            {format(restTotal)}
          </span>
          <span className="w-[22px] shrink-0 text-right text-[6pt] tabular-nums text-slate-400">
            {(restShare * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

const AXIS = {
  stroke: "#94a3b8",
  fontSize: 6,
  tickLine: false as const,
  axisLine: false as const,
};

/* ---------- report ---------- */

/**
 * Last six months that actually carry data. A yearly period runs to December,
 * so without this the chart would spend a third of its width on empty future
 * months while hiding the ones that matter.
 */
function lastMonthsWithData<T>(points: T[], hasData: (p: T) => boolean, count = 6): T[] {
  let end = points.length;
  while (end > 0 && !hasData(points[end - 1])) end--;
  if (end === 0) return points.slice(-count);
  return points.slice(Math.max(0, end - count), end);
}

export function ReportSheet({ data }: { data: ReportData }) {
  // Six months keeps one value label per bar readable at this width; twelve
  // would force the labels to overlap.
  const trend = lastMonthsWithData(data.trend, (p) => p.income !== 0 || p.expense !== 0);
  const visitTrend = lastMonthsWithData(data.visitTrend, (p) => p.total !== 0);

  return (
    <>
      <div className="print-hidden sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <Link
          href="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke dashboard
        </Link>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Pratinjau laporan 1 halaman — periode {data.periodLabel}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Cetak / Simpan PDF
        </button>
      </div>

      {/* A4 content box (210mm − 2×10mm margins). */}
      <div className="mx-auto my-4 w-[190mm] bg-white text-slate-900 shadow-lg print:m-0 print:w-auto print:shadow-none">
        <header className="flex items-end justify-between gap-4 border-b-[2.5px] pb-2.5" style={{ borderColor: NAVY }}>
          <Image src="/zea-logo.jpg" alt="ZEA Medika Farma" width={1284} height={293} className="h-8 w-auto" priority />
          <div className="text-right">
            <p className="text-[12pt] font-bold leading-none" style={{ color: NAVY }}>
              Laporan Kinerja
            </p>
            <p className="mt-1 text-[8.5pt] leading-none text-slate-600">Periode {data.periodLabel}</p>
            <p className="mt-1 text-[6.5pt] leading-none text-slate-400">
              Pembanding {data.compareLabel} · dicetak {new Date(data.generatedAt).toLocaleDateString("id-ID")}
            </p>
          </div>
        </header>

        {/* ============ 1. KEUANGAN ============ */}
        <section className="mt-3.5">
          <SectionBand title="Keuangan" subtitle={`vs ${data.compareLabel}`} />

          <div className="mt-2 grid grid-cols-4 gap-2">
            <Metric
              label="Omzet"
              value={formatCurrency(data.kpis.omzet.current)}
              comparison={data.kpis.omzet}
              accent={SEMANTIC_COLORS.income.light}
            />
            <Metric
              label="Pengeluaran"
              value={formatCurrency(data.kpis.expense.current)}
              comparison={data.kpis.expense}
              invert
              accent={SEMANTIC_COLORS.expense.light}
            />
            <Metric
              label="Net Profit"
              value={formatCurrency(data.kpis.netProfit.current)}
              comparison={data.kpis.netProfit}
              accent={SEMANTIC_COLORS.profit.light}
            />
            <Metric
              label="Margin"
              value={`${data.kpis.marginPercent.current.toFixed(1)}%`}
              comparison={data.kpis.marginPercent}
              accent={NAVY}
            />
          </div>

          <div className="mt-3 flex gap-[6mm]">
            <div className="w-[108mm] shrink-0">
              <BlockTitle>Tren Omzet &amp; Pengeluaran — 6 bulan</BlockTitle>
              <BarChart width={CHART_W} height={112} data={trend} margin={{ top: 12, right: 2, left: 0, bottom: 0 }} barCategoryGap="24%">
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="2 2" />
                  <XAxis dataKey="label" interval={0} {...AXIS} />
                  <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} width={40} {...AXIS} />
                  <Bar dataKey="income" fill={SEMANTIC_COLORS.income.light} radius={[2, 2, 0, 0]} maxBarSize={12} isAnimationActive={false}>
                    {/* Only the omzet series is labelled — labelling both would
                        collide at this width. */}
                    <LabelList
                      dataKey="income"
                      position="top"
                      offset={3}
                      fontSize={5.5}
                      fill="#475569"
                      formatter={(v: unknown) => formatCurrencyCompact(Number(v) || 0).replace("Rp ", "")}
                    />
                  </Bar>
                  <Bar dataKey="expense" fill={SEMANTIC_COLORS.expense.light} radius={[2, 2, 0, 0]} maxBarSize={12} isAnimationActive={false} />
              </BarChart>
              <p className="mt-1 flex flex-wrap gap-2.5 text-[6pt] text-slate-500">
                <LegendDot color={SEMANTIC_COLORS.income.light} label="Omzet (berlabel)" />
                <LegendDot color={SEMANTIC_COLORS.expense.light} label="Pengeluaran" />
              </p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div>
                <BlockTitle>Omzet per kategori</BlockTitle>
                <RankedList
                  items={data.incomeCategories.map((c) => ({
                    label: c.category,
                    total: c.total,
                    color: c.color,
                    share: c.share,
                  }))}
                  format={(v) => formatCurrencyCompact(v).replace("Rp ", "")}
                  max={3}
                />
              </div>
              <div>
                <BlockTitle>Pengeluaran per kategori</BlockTitle>
                <RankedList
                  items={data.expenseCategories.map((c) => ({
                    label: c.category,
                    total: c.total,
                    color: c.color,
                    share: c.share,
                  }))}
                  format={(v) => formatCurrencyCompact(v).replace("Rp ", "")}
                  max={4}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============ 2. KUNJUNGAN PASIEN ============ */}
        <section className="mt-5">
          <SectionBand title="Kunjungan Pasien" subtitle={`vs ${data.compareLabel}`} />

          {data.hasVisitData ? (
            <>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Metric
                  label="Total Kunjungan"
                  value={formatNumber(data.visitKpis.total.current)}
                  comparison={data.visitKpis.total}
                  accent={NAVY}
                />
                <Metric
                  label="Pasien Baru"
                  value={formatNumber(data.visitKpis.baru.current)}
                  comparison={data.visitKpis.baru}
                  accent={VISIT_PAIR_COLORS.primary.light}
                />
                <Metric
                  label="Pasien Lama"
                  value={formatNumber(data.visitKpis.lama.current)}
                  comparison={data.visitKpis.lama}
                  accent={VISIT_PAIR_COLORS.secondary.light}
                />
                <Metric
                  label="Porsi Baru"
                  value={`${data.visitKpis.newPatientRate.current.toFixed(1)}%`}
                  comparison={data.visitKpis.newPatientRate}
                  accent={NAVY}
                />
              </div>

              <div className="mt-3 flex gap-[6mm]">
                <div className="w-[108mm] shrink-0">
                  <BlockTitle>Tren kunjungan — 6 bulan</BlockTitle>
                  <BarChart width={CHART_W} height={112} data={visitTrend} margin={{ top: 12, right: 2, left: 0, bottom: 0 }} barCategoryGap="24%">
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="2 2" />
                      <XAxis dataKey="label" interval={0} {...AXIS} />
                      <YAxis width={22} allowDecimals={false} {...AXIS} />
                      <Bar dataKey="baru" stackId="v" fill={VISIT_PAIR_COLORS.primary.light} maxBarSize={18} isAnimationActive={false} />
                      <Bar dataKey="lama" stackId="v" fill={VISIT_PAIR_COLORS.secondary.light} radius={[2, 2, 0, 0]} maxBarSize={18} isAnimationActive={false}>
                        {/* One label per stack, carrying the total — per-segment
                            labels would sit on top of each other. */}
                        <LabelList
                          dataKey="total"
                          position="top"
                          offset={3}
                          fontSize={6}
                          fill="#475569"
                          formatter={(v: unknown) => formatNumber(Number(v) || 0)}
                        />
                      </Bar>
                  </BarChart>
                  <p className="mt-1 flex flex-wrap gap-2.5 text-[6pt] text-slate-500">
                    <LegendDot color={VISIT_PAIR_COLORS.primary.light} label="Pasien Baru" />
                    <LegendDot color={VISIT_PAIR_COLORS.secondary.light} label="Pasien Lama" />
                    <span className="text-slate-400">angka = total kunjungan bulan itu</span>
                  </p>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div>
                    <BlockTitle>Jenis layanan</BlockTitle>
                    <RankedList items={data.services} format={formatNumber} max={4} />
                  </div>
                  <div>
                    <BlockTitle>Performa staf</BlockTitle>
                    <RankedList items={data.staff} format={formatNumber} max={3} />
                  </div>
                  <div>
                    <BlockTitle>Gender</BlockTitle>
                    <GenderBar items={data.gender} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-[7.5pt] italic text-slate-400">
              Tidak ada data kunjungan untuk periode ini.
            </p>
          )}
        </section>

        <footer className="mt-5 border-t border-slate-200 pt-2 text-[6pt] text-slate-400">
          ZEA Medika Farma — laporan internal. Bersumber dari Google Sheets &quot;Smart Finance ZMF&quot;, dibuat
          otomatis oleh dashboard pada {new Date(data.generatedAt).toLocaleString("id-ID")}.
        </footer>
      </div>
    </>
  );
}

function GenderBar({ items }: { items: VisitBreakdownItem[] }) {
  const total = items.reduce((a, i) => a + i.total, 0);
  if (total === 0) return <p className="text-[6.5pt] italic text-slate-400">Tidak ada data</p>;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-[9px] gap-[2px] overflow-hidden rounded-[2px]">
        {items.map((i) => (
          <div key={i.label} style={{ width: `${i.share * 100}%`, background: i.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {items.map((i) => (
          <span key={i.label} className="flex items-center gap-1 text-[6.5pt] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />
            {i.label}
            <span className="font-semibold tabular-nums text-slate-900">{formatNumber(i.total)}</span>
            <span className="tabular-nums text-slate-400">{(i.share * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

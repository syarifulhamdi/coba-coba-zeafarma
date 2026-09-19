"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Bar, BarChart, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
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

function DeltaText({ comparison, invert = false }: { comparison: KpiComparison; invert?: boolean }) {
  if (comparison.deltaPercent === null) return <span className="text-[7pt] text-slate-400">—</span>;
  const positive = invert ? comparison.deltaPercent <= 0 : comparison.deltaPercent >= 0;
  return (
    <span className={`text-[7pt] font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {formatPercent(comparison.deltaPercent)}
    </span>
  );
}

function Metric({
  label,
  value,
  comparison,
  invert,
}: {
  label: string;
  value: string;
  comparison: KpiComparison;
  invert?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <p className="text-[7pt] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-[11pt] font-semibold leading-none tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 leading-none">
        <DeltaText comparison={comparison} invert={invert} />
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-slate-200 pb-1 text-[7.5pt] font-bold uppercase tracking-wide text-slate-700">
      {children}
    </h2>
  );
}

function RankedList({
  items,
  format,
  emptyLabel = "Tidak ada data",
  max = 5,
}: {
  items: { label: string; total: number; color: string; share: number }[];
  format: (v: number) => string;
  emptyLabel?: string;
  max?: number;
}) {
  if (items.length === 0) {
    return <p className="py-1 text-[7pt] italic text-slate-400">{emptyLabel}</p>;
  }
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  const restTotal = rest.reduce((acc, i) => acc + i.total, 0);
  const restShare = rest.reduce((acc, i) => acc + i.share, 0);

  return (
    <table className="w-full border-collapse text-[7.5pt]">
      <tbody>
        {shown.map((item) => (
          <tr key={item.label} className="border-b border-slate-100 last:border-0">
            <td className="w-2 py-[4px] pr-1 align-middle">
              <span className="block h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
            </td>
            <td className="py-[4px] pr-1 align-middle text-slate-700">{item.label}</td>
            <td className="py-[4px] pr-1 text-right align-middle tabular-nums font-medium text-slate-900">
              {format(item.total)}
            </td>
            <td className="w-8 py-[4px] text-right align-middle tabular-nums text-slate-500">
              {(item.share * 100).toFixed(0)}%
            </td>
          </tr>
        ))}
        {rest.length > 0 && (
          <tr className="text-slate-500">
            <td />
            <td className="py-[4px] pr-1 italic">Lainnya ({rest.length})</td>
            <td className="py-[4px] pr-1 text-right tabular-nums">{format(restTotal)}</td>
            <td className="py-[4px] text-right tabular-nums">{(restShare * 100).toFixed(0)}%</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function ReportSheet({ data }: { data: ReportData }) {
  // Keep the printed charts short: the whole report has to land on one A4 page,
  // and the last six months carry the trend without crowding the axis.
  const trend = data.trend.slice(-6);
  const visitTrend = data.visitTrend.slice(-6);

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

      {/* Fixed A4 content box (210mm − 2×10mm margins). Everything below is
          sized in points so the on-screen preview matches the printed page. */}
      <div className="mx-auto my-4 w-[190mm] bg-white p-0 text-slate-900 shadow-lg print:m-0 print:w-auto print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-[#0d4a7d] pb-3">
          <Image src="/zea-logo.jpg" alt="ZEA Medika Farma" width={1284} height={293} className="h-8 w-auto" priority />
          <div className="text-right">
            <p className="text-[11pt] font-bold leading-tight text-[#0d4a7d]">Laporan Kinerja</p>
            <p className="text-[9pt] leading-tight text-slate-600">Periode {data.periodLabel}</p>
            <p className="text-[7pt] leading-tight text-slate-400">
              Pembanding: {data.compareLabel} · Dicetak {new Date(data.generatedAt).toLocaleDateString("id-ID")}
            </p>
          </div>
        </header>

        <section className="mt-5">
          <SectionTitle>Ringkasan Keuangan</SectionTitle>
          <div className="grid grid-cols-4 gap-2.5">
            <Metric label="Omzet" value={formatCurrency(data.kpis.omzet.current)} comparison={data.kpis.omzet} />
            <Metric
              label="Pengeluaran"
              value={formatCurrency(data.kpis.expense.current)}
              comparison={data.kpis.expense}
              invert
            />
            <Metric
              label="Net Profit"
              value={formatCurrency(data.kpis.netProfit.current)}
              comparison={data.kpis.netProfit}
            />
            <Metric
              label="Margin"
              value={`${data.kpis.marginPercent.current.toFixed(1)}%`}
              comparison={data.kpis.marginPercent}
            />
          </div>
        </section>

        <section className="mt-5">
          <SectionTitle>Ringkasan Kunjungan Pasien</SectionTitle>
          <div className="grid grid-cols-4 gap-2.5">
            <Metric
              label="Total Kunjungan"
              value={formatNumber(data.visitKpis.total.current)}
              comparison={data.visitKpis.total}
            />
            <Metric
              label="Pasien Baru"
              value={formatNumber(data.visitKpis.baru.current)}
              comparison={data.visitKpis.baru}
            />
            <Metric
              label="Pasien Lama"
              value={formatNumber(data.visitKpis.lama.current)}
              comparison={data.visitKpis.lama}
            />
            <Metric
              label="Porsi Baru"
              value={`${data.visitKpis.newPatientRate.current.toFixed(1)}%`}
              comparison={data.visitKpis.newPatientRate}
            />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <SectionTitle>Tren Keuangan (6 Bulan)</SectionTitle>
            <ResponsiveContainer width="100%" height={108}>
              <ComposedChart data={trend} margin={{ top: 2, right: 2, left: 0, bottom: 0 }} barCategoryGap="26%">
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={7} tickLine={false} axisLine={false} interval={0} />
                <YAxis
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  stroke="#94a3b8"
                  fontSize={7}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Bar dataKey="income" fill={SEMANTIC_COLORS.income.light} radius={[2, 2, 0, 0]} maxBarSize={13} isAnimationActive={false} />
                <Bar dataKey="expense" fill={SEMANTIC_COLORS.expense.light} radius={[2, 2, 0, 0]} maxBarSize={13} isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={SEMANTIC_COLORS.profit.light}
                  strokeWidth={1.5}
                  dot={{ r: 1.5 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="mt-0.5 flex flex-wrap gap-2 text-[7pt] text-slate-500">
              <LegendDot color={SEMANTIC_COLORS.income.light} label="Omzet" />
              <LegendDot color={SEMANTIC_COLORS.expense.light} label="Pengeluaran" />
              <LegendDot color={SEMANTIC_COLORS.profit.light} label="Net Profit" />
            </p>
          </div>

          <div>
            <SectionTitle>Tren Kunjungan (6 Bulan)</SectionTitle>
            {data.hasVisitData ? (
              <>
                <ResponsiveContainer width="100%" height={108}>
                  <BarChart data={visitTrend} margin={{ top: 2, right: 2, left: 0, bottom: 0 }} barCategoryGap="26%">
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={7} tickLine={false} axisLine={false} interval={0} />
                    <YAxis stroke="#94a3b8" fontSize={7} tickLine={false} axisLine={false} width={26} allowDecimals={false} />
                    <Bar dataKey="baru" stackId="v" fill={VISIT_PAIR_COLORS.primary.light} maxBarSize={20} isAnimationActive={false} />
                    <Bar
                      dataKey="lama"
                      stackId="v"
                      fill={VISIT_PAIR_COLORS.secondary.light}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={20}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-0.5 flex flex-wrap gap-2 text-[7pt] text-slate-500">
                  <LegendDot color={VISIT_PAIR_COLORS.primary.light} label="Pasien Baru" />
                  <LegendDot color={VISIT_PAIR_COLORS.secondary.light} label="Pasien Lama" />
                </p>
              </>
            ) : (
              <p className="py-8 text-center text-[7.5pt] italic text-slate-400">Tidak ada data kunjungan.</p>
            )}
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <SectionTitle>Omzet per Kategori</SectionTitle>
            <RankedList
              items={data.incomeCategories.map((c) => ({ label: c.category, total: c.total, color: c.color, share: c.share }))}
              format={formatCurrencyCompact}
            />
          </div>
          <div>
            <SectionTitle>Pengeluaran per Kategori</SectionTitle>
            <RankedList
              items={data.expenseCategories.map((c) => ({ label: c.category, total: c.total, color: c.color, share: c.share }))}
              format={formatCurrencyCompact}
            />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-6">
          <div>
            <SectionTitle>Jenis Layanan</SectionTitle>
            <RankedList items={data.services} format={formatNumber} max={4} />
          </div>
          <div>
            <SectionTitle>Performa Staf</SectionTitle>
            <RankedList items={data.staff} format={formatNumber} max={4} />
          </div>
          <div>
            <SectionTitle>Gender</SectionTitle>
            <RankedList items={data.gender} format={formatNumber} max={2} />
          </div>
        </section>

        <footer className="mt-6 border-t border-slate-200 pt-2 text-[6.5pt] text-slate-400">
          ZEA Medika Farma — laporan internal. Data bersumber dari Google Sheets &quot;Smart Finance ZMF&quot;, dibuat
          otomatis oleh dashboard pada {new Date(data.generatedAt).toLocaleString("id-ID")}.
        </footer>
      </div>
    </>
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

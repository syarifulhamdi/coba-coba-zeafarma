"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardFilters, PeriodMode } from "@/types";

interface PeriodFilterProps {
  filters: DashboardFilters;
  availableYears: string[];
  onChange: (patch: Partial<DashboardFilters>) => void;
}

export function PeriodFilter({ filters, availableYears, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Periode</Label>
        <Tabs value={filters.mode} onValueChange={(v) => onChange({ mode: v as PeriodMode })}>
          <TabsList>
            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            <TabsTrigger value="yearly">Tahunan</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 flex-wrap items-end gap-3 sm:justify-end">
        {filters.mode === "monthly" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="month-input" className="text-xs text-muted-foreground">
              Bulan
            </Label>
            <Input
              id="month-input"
              type="month"
              value={filters.month}
              onChange={(e) => e.target.value && onChange({ month: e.target.value })}
              className="w-40"
            />
          </div>
        )}

        {filters.mode === "yearly" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tahun</Label>
            <Select value={filters.year} onValueChange={(v) => onChange({ year: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filters.mode === "custom" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="from-input" className="text-xs text-muted-foreground">
                Dari
              </Label>
              <Input
                id="from-input"
                type="date"
                value={filters.from}
                onChange={(e) => e.target.value && onChange({ from: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="to-input" className="text-xs text-muted-foreground">
                Sampai
              </Label>
              <Input
                id="to-input"
                type="date"
                value={filters.to}
                onChange={(e) => e.target.value && onChange({ to: e.target.value })}
                className="w-40"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Bandingkan</Label>
          <Select
            value={filters.compare}
            onValueChange={(v) => onChange({ compare: v as DashboardFilters["compare"] })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Periode sebelumnya</SelectItem>
              <SelectItem value="yoy">Tahun lalu (YoY)</SelectItem>
              <SelectItem value="none">Tanpa perbandingan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

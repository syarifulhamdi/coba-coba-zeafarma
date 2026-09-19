"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/types";

export function ExportMenu({ filters }: { filters: DashboardFilters }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const query = filtersToParams(filters).toString();
  const csvHref = `/api/export?${query}`;
  const reportHref = `/laporan?${query}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Export Laporan</span>
        <span className="sm:hidden">Export</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          <a
            href={csvHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
          >
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-[13px] font-medium text-foreground">Unduh Excel / CSV</span>
              <span className="block text-xs text-muted-foreground">Ringkasan + rincian, siap dibuka di Excel</span>
            </span>
          </a>
          <a
            href={reportHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
          >
            <Printer className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-[13px] font-medium text-foreground">Laporan PDF (1 halaman)</span>
              <span className="block text-xs text-muted-foreground">Ringkasan keuangan + kunjungan, siap cetak</span>
            </span>
          </a>
        </div>
      )}
    </div>
  );
}

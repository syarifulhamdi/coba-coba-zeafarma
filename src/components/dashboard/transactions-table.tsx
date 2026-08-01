"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";

type SortKey = "date" | "category" | "net";
type SortDir = "asc" | "desc";

export function TransactionsTable({ transactions, title, description }: { transactions: Transaction[]; title: string; description: string }) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = transactions;
    if (q) {
      rows = rows.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = (a.date ?? "").localeCompare(b.date ?? "");
      if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      if (sortKey === "net") cmp = a.net - b.net;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [transactions, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
              {open ? "Sembunyikan" : "Tampilkan"}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kategori, deskripsi, catatan..."
                className="pl-8"
              />
            </div>

            <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <SortableHead label="Tanggal" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
                    <TableHead>Tipe</TableHead>
                    <SortableHead label="Kategori" active={sortKey === "category"} dir={sortDir} onClick={() => toggleSort("category")} />
                    <TableHead>Deskripsi</TableHead>
                    <SortableHead label="Nominal" active={sortKey === "net"} dir={sortDir} onClick={() => toggleSort("net")} className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Tidak ada transaksi yang cocok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t, i) => (
                      <TableRow key={`${t.type}-${t.rowIndex}-${i}`}>
                        <TableCell className="tabular-nums text-muted-foreground">{t.date ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === "income" ? "success" : "destructive"}>
                            {t.type === "income" ? "Omzet" : "Keluar"}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground">
                          {t.description || t.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(t.net)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">{filtered.length} transaksi ditampilkan.</p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        <ChevronsUpDown className={cn("h-3 w-3", active ? "text-foreground" : "text-muted-foreground/60")} />
        {active && <span className="sr-only">{dir === "asc" ? "menaik" : "menurun"}</span>}
      </button>
    </TableHead>
  );
}

import { formatCurrency } from "@/lib/utils";

interface TooltipRow {
  label: string;
  value: number;
  color: string;
}

export function ChartTooltipCard({
  title,
  rows,
  format = formatCurrency,
  footer,
}: {
  title: string;
  rows: TooltipRow[];
  format?: (value: number) => string;
  footer?: { label: string; value: number };
}) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-foreground">{title}</div>
      <div className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="tabular-nums font-medium text-foreground">{format(row.value)}</span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <span className="text-muted-foreground">{footer.label}</span>
          <span className="tabular-nums font-semibold text-foreground">{format(footer.value)}</span>
        </div>
      )}
    </div>
  );
}

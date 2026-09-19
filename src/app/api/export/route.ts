import { getSnapshot } from "@/lib/data";
import { defaultFilters, parseFilters } from "@/lib/filters";
import { buildMonthlyReport, reportFileName, reportToCsv } from "@/lib/report";

export async function GET(request: Request) {
  const snapshot = await getSnapshot();
  const params = new URL(request.url).searchParams;
  const filters = parseFilters(params, defaultFilters([...snapshot.income, ...snapshot.expenses]));

  const report = buildMonthlyReport(snapshot, filters);
  const csv = reportToCsv(report);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFileName(report.periodLabel)}"`,
      "Cache-Control": "no-store",
    },
  });
}

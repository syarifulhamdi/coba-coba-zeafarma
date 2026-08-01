import { Suspense } from "react";
import { getSnapshot } from "@/lib/data";
import { DashboardApp } from "@/components/dashboard/dashboard-app";

// This route is gated by middleware (password-protected session cookie) and
// always needs a fresh auth check, so it is rendered per-request rather than
// statically at build time. The 15-minute revalidation window for the
// Google Sheets data itself is handled by `unstable_cache` in lib/data.ts,
// not by page-level ISR — that's what keeps Sheets API calls infrequent.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getSnapshot();

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Memuat dashboard...</div>}>
      <DashboardApp snapshot={snapshot} />
    </Suspense>
  );
}

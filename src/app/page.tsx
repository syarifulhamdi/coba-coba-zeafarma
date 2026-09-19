import { Suspense } from "react";
import { cookies } from "next/headers";
import { getSnapshot } from "@/lib/data";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { findUser } from "@/lib/users";
import { DashboardApp } from "@/components/dashboard/dashboard-app";

// This route is gated by middleware (signed session cookie) and always needs a
// fresh auth check, so it is rendered per-request rather than statically at
// build time. The 15-minute revalidation window for the Google Sheets data
// itself is handled by `unstable_cache` in lib/data.ts, not by page-level ISR —
// that's what keeps Sheets API calls infrequent.
export const dynamic = "force-dynamic";

async function currentUserName(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return "";
  // The account may have been removed from DASHBOARD_USERS since the cookie
  // was issued; fall back to the name on the cookie rather than failing.
  return findUser(session.username)?.name ?? session.username;
}

export default async function DashboardPage() {
  const [snapshot, userName] = await Promise.all([getSnapshot(), currentUserName()]);
  // Short commit marker, so a stale cached build is obvious from the footer.
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Memuat dashboard...</div>}>
      <DashboardApp snapshot={snapshot} userName={userName} buildId={buildId} />
    </Suspense>
  );
}

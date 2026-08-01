import { google, sheets_v4 } from "googleapis";

let cachedClient: sheets_v4.Sheets | null = null;

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !rawKey || !spreadsheetId) {
    throw new Error(
      "Missing Google Sheets credentials. Make sure GOOGLE_SERVICE_ACCOUNT_EMAIL, " +
        "GOOGLE_PRIVATE_KEY and GOOGLE_SHEETS_ID are set (see .env.example)."
    );
  }

  // Vercel/most env UIs store multi-line keys with literal "\n" sequences.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  return { email, privateKey, spreadsheetId };
}

function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const { email, privateKey } = getCredentials();
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export type SheetGrid = unknown[][];

/**
 * Fetch a raw (unformatted) grid of values for a tab. Numbers come back as
 * numbers, dates as formatted display strings (e.g. "30 Jan 2025"), and
 * empty cells as undefined. This is intentionally low-level — parsing into
 * typed rows happens in lib/parse-sheets.ts, which locates the header row
 * by scanning rather than assuming a fixed offset.
 */
export async function fetchSheetGrid(tabName: string, a1Range = "A1:AB1000"): Promise<SheetGrid> {
  const { spreadsheetId } = getCredentials();
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!${a1Range}`,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  return (res.data.values as SheetGrid) ?? [];
}

export const SHEET_TABS = {
  income: process.env.SHEET_TAB_INCOME || "Income",
  expenses: process.env.SHEET_TAB_EXPENSES || "Expenses",
  setup: process.env.SHEET_TAB_SETUP || "Setup",
};

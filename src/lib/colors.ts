// Categorical color system for charts.
//
// The first 8 slots are the dataviz-skill validated categorical palette
// (fixed hue order, CVD-safe on the adjacent pairlist in both light/dark
// modes). Income has only 3 categories, so it uses slots 1-3, which are
// additionally validated as safe under *all-pairs* comparison (donut/pie).
// Expense has more than 8 known categories, so entries beyond slot 8 use an
// extended fallback tier; those bars always carry a direct text label, which
// is the documented mitigation for colors outside the core validated set.
//
// Colors are assigned per category NAME, not per rank, so a category's color
// never changes when the filtered period changes the sort order.

interface HueStep {
  light: string;
  dark: string;
}

const CORE_PALETTE: HueStep[] = [
  { light: "#2a78d6", dark: "#3987e5" }, // 1 blue
  { light: "#eb6834", dark: "#d95926" }, // 2 orange
  { light: "#1baf7a", dark: "#199e70" }, // 3 aqua
  { light: "#eda100", dark: "#c98500" }, // 4 yellow
  { light: "#e87ba4", dark: "#d55181" }, // 5 magenta
  { light: "#008300", dark: "#008300" }, // 6 green
  { light: "#4a3aa7", dark: "#9085e9" }, // 7 violet
  { light: "#e34948", dark: "#e66767" }, // 8 red
];

// Extended fallback tier for categories beyond the validated 8. These are
// tints/shades of the core hue family, not independently CVD-validated —
// bars using these colors must always show a direct label.
const EXTENDED_PALETTE: HueStep[] = [
  { light: "#7fb2e8", dark: "#6ea3dc" },
  { light: "#f0a479", dark: "#e29b6b" },
  { light: "#7fd4b6", dark: "#5fc09e" },
  { light: "#f3c467", dark: "#d9a13f" },
  { light: "#f0aac6", dark: "#e08bae" },
  { light: "#5fb35f", dark: "#4a9e4a" },
  { light: "#8f7fd0", dark: "#a99ee8" },
  { light: "#e88685", dark: "#e2807f" },
];

export const INCOME_CATEGORY_ORDER = [
  "Penjualan Apotek",
  "Jasa Pelayanan Klinik",
  "Penjualan Mitra Apotek",
];

export const EXPENSE_CATEGORY_ORDER = [
  "Belanja Obat (HPA)",
  "Gaji Pegawai",
  "Jasa Pelayanan",
  "Biaya Tetap",
  "Maintenance",
  "ATK & Percetakan",
  "Biaya Langganan & Promosi/Marketing",
  "Biaya Kegiatan",
  "Pajak dan lain-lain",
  "Kerusakan Persediaan",
  "Biaya Sewa Toko",
  "Diskon/Promo",
  "Bahan Medis Habis Pakai (BMHP)",
  "Bonus/Reward Pegawai",
  "Service Costumer",
  "Penambahan alat / kebutuhan",
];

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ").replace(/\/\s*/g, "/");
}

function buildLookup(order: string[]): Map<string, number> {
  const map = new Map<string, number>();
  order.forEach((name, i) => map.set(normalize(name), i));
  return map;
}

const INCOME_LOOKUP = buildLookup(INCOME_CATEGORY_ORDER);
const EXPENSE_LOOKUP = buildLookup(EXPENSE_CATEGORY_ORDER);

function hashIndex(name: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

function colorForIndex(index: number, mode: "light" | "dark"): string {
  if (index < CORE_PALETTE.length) return CORE_PALETTE[index][mode];
  const extIndex = (index - CORE_PALETTE.length) % EXTENDED_PALETTE.length;
  return EXTENDED_PALETTE[extIndex][mode];
}

function resolveIndex(category: string, lookup: Map<string, number>, fallbackMod: number): number {
  const known = lookup.get(normalize(category));
  if (known !== undefined) return known;
  // Unknown category (not in the curated lists): deterministic hash-based
  // slot so the same name always renders the same color, folded into the
  // extended tier so it never collides with a curated slot.
  return CORE_PALETTE.length + hashIndex(category, fallbackMod);
}

export function incomeCategoryColor(category: string, mode: "light" | "dark" = "light"): string {
  const index = resolveIndex(category, INCOME_LOOKUP, EXTENDED_PALETTE.length);
  return colorForIndex(index, mode);
}

export function expenseCategoryColor(category: string, mode: "light" | "dark" = "light"): string {
  const index = resolveIndex(category, EXPENSE_LOOKUP, EXTENDED_PALETTE.length);
  return colorForIndex(index, mode);
}

// Visit-traffic categories. The seven service types fit inside the validated
// core palette; staff names are open-ended so they fold into the extended tier
// by name hash, and always render with a direct label alongside the bar.
export const VISIT_SERVICE_ORDER = [
  "Konsultasi/Berobat",
  "Observasi",
  "Rawat Inap",
  "Home Visit",
  "Immune Booster",
  "Medical Chek Up",
  "Tindakan Lain-lain",
];

const VISIT_SERVICE_LOOKUP = buildLookup(VISIT_SERVICE_ORDER);

export function visitServiceColor(label: string, mode: "light" | "dark" = "light"): string {
  const index = resolveIndex(label, VISIT_SERVICE_LOOKUP, EXTENDED_PALETTE.length);
  return colorForIndex(index, mode);
}

export function visitStaffColor(label: string, mode: "light" | "dark" = "light"): string {
  return colorForIndex(hashIndex(label, CORE_PALETTE.length + EXTENDED_PALETTE.length), mode);
}

// Two-value splits (new vs returning, male vs female) use slots 1 and 2, the
// pair validated as distinguishable under all common CVD types.
export const VISIT_PAIR_COLORS = {
  primary: CORE_PALETTE[0],
  secondary: CORE_PALETTE[1],
};

export function visitPairColor(label: string, mode: "light" | "dark" = "light"): string {
  const normalized = normalize(label);
  const isSecondary = /lama|perempuan|wanita/.test(normalized);
  return (isSecondary ? VISIT_PAIR_COLORS.secondary : VISIT_PAIR_COLORS.primary)[mode];
}

// Semantic (non-categorical) chart roles — chrome, not data identity.
export const SEMANTIC_COLORS = {
  income: { light: "#1baf7a", dark: "#199e70" },
  expense: { light: "#eb6834", dark: "#d95926" },
  profit: { light: "#2a78d6", dark: "#3987e5" },
  target: { light: "#898781", dark: "#898781" },
  good: { light: "#0ca30c", dark: "#0ca30c" },
  critical: { light: "#d03b3b", dark: "#e66767" },
};

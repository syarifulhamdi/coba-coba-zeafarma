import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const idrCompactFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return idrFormatter.format(Math.round(value));
}

export function formatCurrencyCompact(value: number): string {
  return idrCompactFormatter.format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

const MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function monthLabel(monthNumber: number): string {
  return MONTH_NAMES_ID[(monthNumber - 1 + 12) % 12] ?? String(monthNumber);
}

export function periodKeyLabel(periodKey: string): string {
  const [year, month] = periodKey.split("-");
  if (!month) return periodKey;
  return `${monthLabel(Number(month))} ${year}`;
}

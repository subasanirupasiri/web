import { MARKETS, VEGETABLES } from "./demo-data";
import type { PriceEntry } from "./types";

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMarket(id: string) {
  return MARKETS.find((m) => m.id === id);
}

export function getVegetable(id: string) {
  return VEGETABLES.find((v) => v.id === id);
}

export function getPriceChange(
  prices: PriceEntry[],
  marketId: string,
  vegetableId: string,
  date: string
): { current: number | null; previous: number | null; diff: number | null } {
  const current = prices.find(
    (p) =>
      p.marketId === marketId &&
      p.vegetableId === vegetableId &&
      p.date === date
  )?.price ?? null;

  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const prevDate = d.toISOString().split("T")[0];

  const previous = prices.find(
    (p) =>
      p.marketId === marketId &&
      p.vegetableId === vegetableId &&
      p.date === prevDate
  )?.price ?? null;

  const diff =
    current !== null && previous !== null ? current - previous : null;

  return { current, previous, diff };
}

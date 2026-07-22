import { DEMO_PRICES } from "./demo-data";
import type { PriceEntry } from "./types";

const STORAGE_KEY = "lanka-market-prices";

export function loadPrices(): PriceEntry[] {
  if (typeof window === "undefined") return DEMO_PRICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PRICES));
      return DEMO_PRICES;
    }
    return JSON.parse(raw) as PriceEntry[];
  } catch {
    return DEMO_PRICES;
  }
}

export function savePrices(prices: PriceEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

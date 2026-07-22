export interface MarketCenter {
  id: string;
  name: string;
  nameSi: string;
  district: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  nameSi: string;
  emoji: string;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  nameSi: string;
  emoji: string;
  unit: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface Vegetable {
  id: string;
  name: string;
  nameSi: string;
  emoji: string;
  unit: string;
}

export interface PriceEntry {
  id: string;
  marketId: string;
  vegetableId: string;
  price: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export type ViewTab = "dashboard" | "add" | "history" | "admin";

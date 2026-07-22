"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Pencil,
  Trash2,
  X,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MARKETS, VEGETABLES } from "@/lib/demo-data";
import type { PriceEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface HistoryViewProps {
  prices: PriceEntry[];
  onUpdate: (entries: PriceEntry[]) => void;
  onDelete: (id: string) => void;
}

export function HistoryView({ prices, onUpdate, onDelete }: HistoryViewProps) {
  const [search, setSearch] = useState("");
  const [filterMarket, setFilterMarket] = useState("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [editing, setEditing] = useState<PriceEntry | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...prices];

    if (filterMarket !== "all") {
      result = result.filter((p) => p.marketId === filterMarket);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const veg = VEGETABLES.find((v) => v.id === p.vegetableId);
        const market = MARKETS.find((m) => m.id === p.marketId);
        return (
          veg?.name.toLowerCase().includes(q) ||
          veg?.nameSi.toLowerCase().includes(q) ||
          market?.name.toLowerCase().includes(q)
        );
      });
    }

    result.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return sortNewest ? dateCmp : -dateCmp;
      return a.vegetableId.localeCompare(b.vegetableId);
    });

    return result;
  }, [prices, filterMarket, search, sortNewest]);

  const grouped = useMemo(() => {
    const groups: Record<string, PriceEntry[]> = {};
    for (const entry of filtered) {
      const key = `${entry.date}__${entry.marketId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups);
  }, [filtered]);

  const openEdit = (entry: PriceEntry) => {
    setEditing(entry);
    setEditPrice(entry.price.toString());
  };

  const saveEdit = () => {
    if (!editing) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) return;
    onUpdate(
      prices.map((p) => (p.id === editing.id ? { ...p, price } : p))
    );
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">Price History</h2>
        <p className="text-sm text-text-muted">
          Browse, edit, or delete previous price records
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search vegetable or market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-surface py-2.5 pl-10 pr-8 text-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All markets</option>
              {MARKETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSortNewest((s) => !s)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-muted hover:text-text"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortNewest ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-muted">No price records match your filters</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([key, entries]) => {
            const [date, marketId] = key.split("__");
            const market = MARKETS.find((m) => m.id === marketId)!;
            return (
              <Card key={key} className="p-0 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 bg-background/50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-text">
                      {market.emoji} {market.name}
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(date)}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {entries.length} items
                  </span>
                </div>
                <div className="divide-y divide-border/40">
                  {entries.map((entry) => {
                    const veg = VEGETABLES.find(
                      (v) => v.id === entry.vegetableId
                    )!;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{veg.emoji}</span>
                          <div>
                            <p className="text-sm font-semibold text-text">
                              {veg.name}
                            </p>
                            <p className="text-xs text-text-muted">
                              {veg.nameSi}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-text">
                            {formatCurrency(entry.price)}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(entry)}
                              className="rounded-lg p-2 text-text-muted hover:bg-primary/10 hover:text-primary"
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="rounded-lg p-2 text-text-muted hover:bg-danger/10 hover:text-danger"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <Card className="w-full max-w-sm animate-in slide-in-from-bottom">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-text">Edit Price</h3>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 hover:bg-surface-hover"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              {VEGETABLES.find((v) => v.id === editing.vegetableId)?.emoji}{" "}
              {VEGETABLES.find((v) => v.id === editing.vegetableId)?.name} at{" "}
              {MARKETS.find((m) => m.id === editing.marketId)?.name}
            </p>
            <label className="mb-1 block text-sm font-semibold">Price (Rs.)</label>
            <input
              type="number"
              min="0"
              autoFocus
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="mb-4 w-full rounded-xl border border-border px-4 py-3 text-lg font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveEdit}>
                Save changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <Card className="w-full max-w-sm">
            <h3 className="font-bold text-text">Delete this record?</h3>
            <p className="mt-2 text-sm text-text-muted">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

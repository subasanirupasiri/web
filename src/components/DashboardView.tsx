"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MARKETS, VEGETABLES } from "@/lib/demo-data";
import type { PriceEntry } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getPriceChange,
  todayISO,
} from "@/lib/utils";
import { cn } from "@/lib/cn";

interface DashboardViewProps {
  prices: PriceEntry[];
  selectedMarket: string;
  onMarketChange: (id: string) => void;
  onQuickAdd: () => void;
}

export function DashboardView({
  prices,
  selectedMarket,
  onMarketChange,
  onQuickAdd,
}: DashboardViewProps) {
  const today = todayISO();
  const market = MARKETS.find((m) => m.id === selectedMarket)!;

  const todayEntries = prices.filter(
    (p) => p.marketId === selectedMarket && p.date === today
  );

  const totalMarketsWithData = new Set(
    prices.filter((p) => p.date === today).map((p) => p.marketId)
  ).size;

  const avgChange = todayEntries.reduce((acc, entry) => {
    const { diff } = getPriceChange(
      prices,
      entry.marketId,
      entry.vegetableId,
      entry.date
    );
    return acc + (diff ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Today's Entries"
          value={todayEntries.length.toString()}
          sub={`of ${VEGETABLES.length} vegetables`}
          accent="primary"
        />
        <StatCard
          label="Active Markets"
          value={totalMarketsWithData.toString()}
          sub={`of ${MARKETS.length} centres`}
          accent="accent"
        />
        <StatCard
          label="Selected Market"
          value={market.emoji}
          sub={market.district}
          accent="neutral"
          isEmoji
        />
        <StatCard
          label="Avg. Change"
          value={
            todayEntries.length
              ? `${avgChange >= 0 ? "+" : ""}${Math.round(avgChange / todayEntries.length)}`
              : "—"
          }
          sub="Rs. vs yesterday"
          accent={avgChange > 0 ? "up" : avgChange < 0 ? "down" : "neutral"}
        />
      </div>

      {/* Market selector */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">Market Centres</h2>
          <button
            onClick={onQuickAdd}
            className="text-sm font-semibold text-primary hover:underline"
          >
            + Add prices
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MARKETS.map((m) => {
            const count = prices.filter(
              (p) => p.marketId === m.id && p.date === today
            ).length;
            return (
              <button
                key={m.id}
                onClick={() => onMarketChange(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                  selectedMarket === m.id
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                    : "border-border bg-surface text-text-muted hover:border-primary/30"
                )}
              >
                <span>{m.emoji}</span>
                <span className="whitespace-nowrap">{m.name.split(" ")[0]}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      selectedMarket === m.id
                        ? "bg-white/20"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Price grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text">
            {market.name}
          </h2>
          <p className="text-sm text-text-muted">
            {formatDate(today)} · {todayEntries.length} prices recorded
          </p>
        </div>

        {todayEntries.length === 0 ? (
          <Card className="flex flex-col items-center py-12 text-center">
            <span className="text-4xl mb-3">🥬</span>
            <p className="font-semibold text-text">No prices for today</p>
            <p className="mt-1 text-sm text-text-muted">
              Start adding vegetable prices for {market.name.split(" ")[0]}
            </p>
            <button
              onClick={onQuickAdd}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add today&apos;s prices
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayEntries.map((entry) => {
              const veg = VEGETABLES.find((v) => v.id === entry.vegetableId)!;
              const { diff, previous } = getPriceChange(
                prices,
                entry.marketId,
                entry.vegetableId,
                entry.date
              );
              return (
                <Card key={entry.id} hover className="relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-primary/5" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{veg.emoji}</span>
                      <div>
                        <p className="font-semibold text-text">{veg.name}</p>
                        <p className="text-xs text-text-muted">{veg.nameSi}</p>
                      </div>
                    </div>
                    {diff !== null && (
                      <PriceBadge diff={diff} />
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-text">
                        {formatCurrency(entry.price)}
                      </p>
                      <p className="text-xs text-text-muted">per {veg.unit}</p>
                    </div>
                    {previous !== null && (
                      <p className="text-xs text-text-muted">
                        Was {formatCurrency(previous)}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  isEmoji,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "accent" | "neutral" | "up" | "down";
  isEmoji?: boolean;
}) {
  const bgMap = {
    primary: "bg-primary/8 border-primary/15",
    accent: "bg-accent/8 border-accent/15",
    neutral: "bg-surface border-border/60",
    up: "bg-red-50 border-red-100",
    down: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 sm:p-4",
        bgMap[accent]
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-bold text-text",
          isEmoji ? "text-2xl" : "text-xl sm:text-2xl"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-text-muted sm:text-xs">{sub}</p>
    </div>
  );
}

function PriceBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-text-muted">
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        up ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
      )}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {diff}
    </span>
  );
}

"use client";

import { TrendingDown, TrendingUp, Minus, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MARKETS, VEGETABLES, CATEGORIES, ITEMS } from "@/lib/demo-data";
import type { PriceEntry } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getPriceChange,
  todayISO,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <StatCard
          label="Today's Entries"
          value={todayEntries.length.toString()}
          sub={`of ${VEGETABLES.length} vegetables`}
          accent="primary"
          delay={0}
        />
        <StatCard
          label="Active Markets"
          value={totalMarketsWithData.toString()}
          sub={`of ${MARKETS.length} centres`}
          accent="accent"
          delay={0.1}
        />
        <StatCard
          label="Selected Market"
          value={market.emoji}
          sub={market.district}
          accent="neutral"
          isEmoji
          delay={0.2}
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
          delay={0.3}
        />
      </motion.div>

      {/* Market selector */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            Market Centres
            <Sparkles className="h-4 w-4 text-primary" />
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onQuickAdd}
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <ArrowUpRight className="h-4 w-4" />
            Add prices
          </motion.button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MARKETS.map((m, index) => {
            const count = prices.filter(
              (p) => p.marketId === m.id && p.date === today
            ).length;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMarketChange(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden",
                  selectedMarket === m.id
                    ? "border-primary bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30"
                    : "border-border bg-surface text-text-muted hover:border-primary/30"
                )}
              >
                {selectedMarket === m.id && (
                  <motion.div
                    layoutId="selectedMarket"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{m.emoji}</span>
                <span className="relative z-10 whitespace-nowrap">{m.name.split(" ")[0]}</span>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      selectedMarket === m.id
                        ? "bg-white/20"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {count}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Price grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            {market.name}
            <Sparkles className="h-4 w-4 text-primary" />
          </h2>
          <p className="text-sm text-text-muted">
            {formatDate(today)} · {todayEntries.length} prices recorded
          </p>
        </div>

        <AnimatePresence>
          {todayEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="flex flex-col items-center py-12 text-center">
                <motion.span 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-4xl mb-3"
                >
                  🥬
                </motion.span>
                <p className="font-semibold text-text">No prices for today</p>
                <p className="mt-1 text-sm text-text-muted">
                  Start adding vegetable prices for {market.name.split(" ")[0]}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onQuickAdd}
                  className="mt-4 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30"
                >
                  Add today&apos;s prices
                </motion.button>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map((category, categoryIndex) => {
                const categoryItems = ITEMS.filter((i) => i.categoryId === category.id);
                const categoryEntries = todayEntries.filter((entry) =>
                  categoryItems.some((item) => item.id === entry.vegetableId)
                );
                
                if (categoryEntries.length === 0) return null;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + categoryIndex * 0.1 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <motion.span 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                        className="text-2xl"
                      >
                        {category.emoji}
                      </motion.span>
                      <h3 className="text-lg font-semibold text-text">{category.name}</h3>
                      <span className="text-sm text-text-muted">({category.nameSi})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryEntries.map((entry, entryIndex) => {
                        const item = ITEMS.find((i) => i.id === entry.vegetableId)!;
                        const { diff, previous } = getPriceChange(
                          prices,
                          entry.marketId,
                          entry.vegetableId,
                          entry.date
                        );
                        return (
                          <Card 
                            key={entry.id} 
                            hover 
                            className="relative overflow-hidden"
                            delay={entryIndex * 0.05}
                          >
                            <motion.div 
                              className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                            />
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <motion.span 
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 + entryIndex * 0.2 }}
                                  className="text-2xl"
                                >
                                  {item.emoji}
                                </motion.span>
                                <div>
                                  <p className="font-semibold text-text">{item.name}</p>
                                  <p className="text-xs text-text-muted">{item.nameSi}</p>
                                </div>
                              </div>
                              {diff !== null && (
                                <PriceBadge diff={diff} />
                              )}
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                              <div>
                                <motion.p 
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="text-2xl font-bold text-text"
                                >
                                  {formatCurrency(entry.price)}
                                </motion.p>
                                <p className="text-xs text-text-muted">per {item.unit}</p>
                              </div>
                              {previous !== null && (
                                <motion.p 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className="text-xs text-text-muted flex items-center gap-1"
                                >
                                  <ArrowDownRight className="h-3 w-3" />
                                  Was {formatCurrency(previous)}
                                </motion.p>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  isEmoji,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "accent" | "neutral" | "up" | "down";
  isEmoji?: boolean;
  delay?: number;
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

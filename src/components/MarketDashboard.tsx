"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/DashboardView";
import { QuickAddView } from "@/components/QuickAddView";
import { HistoryView } from "@/components/HistoryView";
import { AdminPanel } from "@/components/AdminPanel";
import { loadPrices, savePrices } from "@/lib/storage";
import type { PriceEntry, ViewTab } from "@/lib/types";

export function MarketDashboard() {
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>("dashboard");
  const [selectedMarket, setSelectedMarket] = useState("dambulla");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrices(loadPrices());
    setMounted(true);
  }, []);

  const persist = useCallback((updated: PriceEntry[]) => {
    setPrices(updated);
    savePrices(updated);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      persist(prices.filter((p) => p.id !== id));
    },
    [prices, persist]
  );

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-muted">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && (
        <DashboardView
          prices={prices}
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          onQuickAdd={() => setActiveTab("add")}
        />
      )}
      {activeTab === "add" && (
        <QuickAddView
          prices={prices}
          onSave={persist}
          initialMarket={selectedMarket}
          onComplete={() => setActiveTab("dashboard")}
        />
      )}
      {activeTab === "history" && (
        <HistoryView
          prices={prices}
          onUpdate={persist}
          onDelete={handleDelete}
        />
      )}
      {activeTab === "admin" && <AdminPanel />}
    </AppShell>
  );
}

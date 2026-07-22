"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Check,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MARKETS, VEGETABLES } from "@/lib/demo-data";
import type { PriceEntry } from "@/lib/types";
import { generateId } from "@/lib/storage";
import { formatCurrency, todayISO } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface QuickAddViewProps {
  prices: PriceEntry[];
  onSave: (entries: PriceEntry[]) => void;
  initialMarket?: string;
  onComplete?: () => void;
}

type Step = "setup" | "entry" | "done";

export function QuickAddView({
  prices,
  onSave,
  initialMarket,
  onComplete,
}: QuickAddViewProps) {
  const [step, setStep] = useState<Step>("setup");
  const [marketId, setMarketId] = useState(initialMarket ?? "dambulla");
  const [date, setDate] = useState(todayISO());
  const [vegIndex, setVegIndex] = useState(0);
  const [priceInput, setPriceInput] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [sessionEntries, setSessionEntries] = useState<PriceEntry[]>([]);

  const currentVeg = VEGETABLES[vegIndex];
  const market = MARKETS.find((m) => m.id === marketId)!;
  const progress = ((vegIndex + (step === "done" ? 1 : 0)) / VEGETABLES.length) * 100;

  const existingForCurrent = prices.find(
    (p) =>
      p.marketId === marketId &&
      p.vegetableId === currentVeg?.id &&
      p.date === date
  );

  useEffect(() => {
    if (step === "entry" && existingForCurrent) {
      setPriceInput(existingForCurrent.price.toString());
    } else if (step === "entry") {
      setPriceInput("");
    }
  }, [vegIndex, step, existingForCurrent]);

  const saveCurrentAndNext = useCallback(() => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) return;

    const entry: PriceEntry = {
      id: existingForCurrent?.id ?? generateId(),
      marketId,
      vegetableId: currentVeg.id,
      price,
      date,
    };

    const updated = [
      ...prices.filter(
        (p) =>
          !(
            p.marketId === marketId &&
            p.vegetableId === currentVeg.id &&
            p.date === date
          )
      ),
      entry,
    ];

    onSave(updated);
    setSessionEntries((prev) => [...prev, entry]);
    setSavedCount((c) => c + 1);

    if (vegIndex < VEGETABLES.length - 1) {
      setVegIndex((i) => i + 1);
      setPriceInput("");
    } else {
      setStep("done");
    }
  }, [
    priceInput,
    marketId,
    currentVeg,
    date,
    existingForCurrent,
    prices,
    onSave,
    vegIndex,
  ]);

  const skipCurrent = () => {
    if (vegIndex < VEGETABLES.length - 1) {
      setVegIndex((i) => i + 1);
      setPriceInput("");
    } else {
      setStep("done");
    }
  };

  const goBack = () => {
    if (vegIndex > 0) {
      setVegIndex((i) => i - 1);
    } else {
      setStep("setup");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && priceInput) {
      saveCurrentAndNext();
    }
  };

  const reset = () => {
    setStep("setup");
    setVegIndex(0);
    setPriceInput("");
    setSavedCount(0);
    setSessionEntries([]);
  };

  if (step === "setup") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text">Add Daily Prices</h2>
          <p className="mt-1 text-sm text-text-muted">
            Select market and date, then enter prices one vegetable at a time
          </p>
        </div>

        <Card className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
              <MapPin className="h-4 w-4 text-primary" />
              Market Centre
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MARKETS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMarketId(m.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all",
                    marketId === m.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <div>
                    <p className="font-semibold text-text">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.district}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
              <Calendar className="h-4 w-4 text-primary" />
              Date
            </label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setVegIndex(0);
              setStep("entry");
            }}
          >
            Start entering prices
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text">All done!</h2>
        <p className="mt-2 text-text-muted">
          Saved {savedCount} prices for {market.name} on{" "}
          {new Date(date + "T00:00:00").toLocaleDateString("en-LK", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {sessionEntries.length > 0 && (
          <Card className="mt-6 text-left">
            <p className="mb-3 text-sm font-semibold text-text">Saved today</p>
            <div className="space-y-2">
              {sessionEntries.map((e) => {
                const veg = VEGETABLES.find((v) => v.id === e.vegetableId)!;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {veg.emoji} {veg.name}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(e.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={reset}>
            Add more prices
          </Button>
          <Button onClick={onComplete ?? reset}>View dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Progress header */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-text-muted">
            {market.emoji} {market.name.split(" ")[0]}
          </span>
          <span className="font-semibold text-primary">
            {vegIndex + 1} / {VEGETABLES.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Vegetable chips preview */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {VEGETABLES.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setVegIndex(i)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
              i === vegIndex
                ? "bg-primary text-white"
                : i < vegIndex
                  ? "bg-primary/15 text-primary"
                  : "bg-surface border border-border text-text-muted"
            )}
          >
            {v.emoji} {v.name}
          </button>
        ))}
      </div>

      {/* Main entry card */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent px-6 py-8 text-center">
          <span className="text-6xl">{currentVeg.emoji}</span>
          <h2 className="mt-3 text-2xl font-bold text-text">{currentVeg.name}</h2>
          <p className="text-sm text-text-muted">{currentVeg.nameSi}</p>
          {existingForCurrent && (
            <p className="mt-2 text-xs text-accent-dark">
              Existing: {formatCurrency(existingForCurrent.price)} — update below
            </p>
          )}
        </div>

        <div className="px-6 py-6">
          <label className="mb-2 block text-sm font-semibold text-text">
            Price per {currentVeg.unit} (Rs.)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-text-muted">
              Rs.
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              autoFocus
              placeholder="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl border-2 border-border bg-background py-4 pl-14 pr-4 text-3xl font-bold text-text placeholder:text-text-muted/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={goBack} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <Button variant="outline" onClick={skipCurrent} className="shrink-0">
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={!priceInput || parseFloat(priceInput) <= 0}
          onClick={saveCurrentAndNext}
        >
          {vegIndex < VEGETABLES.length - 1 ? (
            <>
              Save & Next
              <ChevronRight className="h-5 w-5" />
            </>
          ) : (
            <>
              Save & Finish
              <Check className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Next preview */}
      {vegIndex < VEGETABLES.length - 1 && (
        <p className="text-center text-xs text-text-muted">
          Up next: {VEGETABLES[vegIndex + 1].emoji}{" "}
          {VEGETABLES[vegIndex + 1].name}
        </p>
      )}
    </div>
  );
}

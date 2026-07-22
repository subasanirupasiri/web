"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { fetchThreeMonthOutlook, ThreeMonthOutlookData } from "@/lib/weatherApi";
import { Calendar, CloudRain, Sun, Cloud, Zap, CloudFog, MapPin, Compass, Sparkles, TrendingUp, Droplets, Thermometer } from "lucide-react";

interface ThreeMonthOutlookViewProps {
  locationName: string; // e.g. "Kotmale (Maswela)" or "Nuwara Eliya"
  lat: number;
  lng: number;
  onSelectDate: (dateStr: string) => void;
}

export function ThreeMonthOutlookView({
  locationName,
  lat,
  lng,
  onSelectDate,
}: ThreeMonthOutlookViewProps) {
  const outlook: ThreeMonthOutlookData = useMemo(() => {
    return fetchThreeMonthOutlook(locationName, lat, lng);
  }, [locationName, lat, lng]);

  const renderIcon = (condition?: string) => {
    switch (condition) {
      case "rain":
        return <CloudRain className="h-6 w-6 text-blue-400 animate-bounce" />;
      case "thunder":
        return <Zap className="h-6 w-6 text-amber-400 animate-pulse" />;
      case "sun":
        return <Sun className="h-6 w-6 text-amber-300 animate-spin-slow" />;
      case "fog":
        return <CloudFog className="h-6 w-6 text-teal-300" />;
      case "cloud":
      default:
        return <Cloud className="h-6 w-6 text-slate-300" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-gradient-to-b from-surface via-surface to-background/60 p-6 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              90-Day Seasonal Forecast
            </span>
            <span className="text-xs text-text-muted font-medium">3-Month Monsoonal Outlook</span>
          </div>
          <h2 className="text-2xl font-black text-text mt-2 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {locationName} Weather (Next 3 Months)
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Long-range climate prediction, monthly rainfall estimates & monsoons for Kotmale valley & Sri Lanka
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span>Monsoon Cycle Active</span>
          </div>
        </div>
      </div>

      {/* 3 Monthly Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {outlook.monthlyOutlooks.map((m, idx) => (
          <motion.div
            key={m.monthName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface-hover/50 p-5 shadow-md relative overflow-hidden"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Month {idx + 1} Projection
                  </span>
                  <h3 className="text-lg font-black text-text mt-0.5">{m.monthName}</h3>
                </div>
                {renderIcon(m.dominantCondition)}
              </div>

              <div className="mt-2 inline-block rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {m.monsoonSeason}
              </div>

              <p className="text-xs font-medium text-text mt-3 leading-relaxed">
                {m.conditionDescription}
              </p>
            </div>

            {/* Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
              <div className="rounded-xl bg-surface p-2 border border-border/40">
                <span className="text-[10px] font-semibold text-text-muted block">Avg Temp</span>
                <span className="text-sm font-black text-amber-500">{m.avgTemp}°C</span>
              </div>
              <div className="rounded-xl bg-surface p-2 border border-border/40">
                <span className="text-[10px] font-semibold text-text-muted block">Rainfall</span>
                <span className="text-sm font-black text-blue-500">{m.totalRainfall} mm</span>
              </div>
              <div className="rounded-xl bg-surface p-2 border border-border/40">
                <span className="text-[10px] font-semibold text-text-muted block">Rainy Days</span>
                <span className="text-sm font-black text-emerald-500">{m.rainyDays} d</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 12-Week Future Trend Horizontal Scrubber */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            12-Week Weekly Forecast Breakdown (Next 90 Days)
          </h4>
          <span className="text-[11px] text-text-muted">Click week to select target date</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {outlook.weeklyTrends.map((w, idx) => (
            <motion.button
              key={w.weekLabel}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + idx * 7);
                onSelectDate(targetDate.toISOString().split("T")[0]);
              }}
              className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-surface-hover/80 p-3 text-center min-w-[110px] hover:border-primary transition-all shadow-sm"
            >
              <span className="text-[10px] font-bold text-primary">{w.weekLabel}</span>
              <span className="text-xs font-bold text-text">{w.startDate}</span>
              {renderIcon(w.condition)}
              <div className="flex items-center gap-2 text-[11px] font-black text-text mt-1">
                <span>{w.expectedTemp}°C</span>
                <span className="text-blue-500 text-[10px] font-bold">{w.expectedRainfall}mm</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

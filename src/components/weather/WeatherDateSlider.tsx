"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Play, Pause, RotateCcw, Clock, ChevronRight, History, Sparkles } from "lucide-react";

interface WeatherDateSliderProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  selectedHour: number; // 0-23
  onHourChange: (hour: number) => void;
}

export function WeatherDateSlider({
  selectedDate,
  onDateChange,
  selectedHour,
  onHourChange,
}: WeatherDateSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getPresetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Quick Presets (Past 1 Year -> Next 3 Months Forecast!)
  const presets = [
    { label: "1 Year Ago", days: -365 },
    { label: "6 Months", days: -180 },
    { label: "1 Month Ago", days: -30 },
    { label: "Today (Live)", days: 0 },
    { label: "7-Day Forecast", days: 7 },
    { label: "1-Month Forecast (+30d)", days: 30 },
    { label: "3-Month Forecast (+90d)", days: 90 },
  ];

  // Hour playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        onHourChange((selectedHour + 1) % 24);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedHour, onHourChange]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface/90 backdrop-blur-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
              Timeline & 3-Month Long-Range Forecast
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-xs text-text-muted">Past (-1 Year) to Next 3 Months (+90 Days) weather prediction</p>
          </div>
        </div>

        {/* Current Selected Date & Hour Display Badge */}
        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-white shadow-md">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-black">{selectedDate}</span>
          <span className="text-xs opacity-80">|</span>
          <Clock className="h-4 w-4" />
          <span className="text-sm font-black">{String(selectedHour).padStart(2, "0")}:00</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const presetDateStr = getPresetDate(preset.days);
          const isSelected = selectedDate === presetDateStr;

          return (
            <motion.button
              key={preset.label}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onDateChange(presetDateStr)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-hover/80 text-text-muted hover:bg-surface-hover hover:text-text"
              }`}
            >
              {preset.label}
            </motion.button>
          );
        })}
      </div>

      {/* Custom Date Input Picker */}
      <div className="flex items-center justify-between gap-3 bg-surface-hover/30 p-2.5 rounded-2xl border border-border/50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <label className="text-xs font-bold text-text">Select Any Date (-365d to +90d):</label>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={getPresetDate(90)}
          min={getPresetDate(-365)}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      {/* 24-Hour Time Scrubber Control */}
      <div className="flex flex-col gap-2 rounded-2xl bg-surface-hover/50 p-3.5 border border-border/50">
        <div className="flex items-center justify-between text-xs font-bold text-text">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-md hover:bg-primary-dark transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <span>24-Hour Time Scrubber: {String(selectedHour).padStart(2, "0")}:00</span>
          </div>
          <span className="text-text-muted text-[11px]">
            {selectedHour >= 6 && selectedHour <= 18 ? "☀️ Daylight" : "🌙 Nighttime"}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="23"
          value={selectedHour}
          onChange={(e) => onHourChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary"
        />

        <div className="flex justify-between text-[10px] font-semibold text-text-muted px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00 (Noon)</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );
}

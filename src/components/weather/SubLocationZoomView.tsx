"use client";

import { motion } from "framer-motion";
import { SRI_LANKA_DISTRICTS, DistrictGeoData, SubLocation } from "@/lib/sriLankaGeoData";
import type { WeatherDataPoint } from "@/lib/weatherApi";
import { CloudRain, Sun, Cloud, Zap, CloudFog, MapPin, ArrowRight, ShieldCheck, Thermometer, Wind, Droplets } from "lucide-react";

interface SubLocationZoomViewProps {
  district: DistrictGeoData;
  subLocationData: Record<string, WeatherDataPoint>;
  selectedSubLocation: SubLocation | null;
  onSelectSubLocation: (sub: SubLocation | null) => void;
  onBackToCountry: () => void;
}

export function SubLocationZoomView({
  district,
  subLocationData,
  selectedSubLocation,
  onSelectSubLocation,
  onBackToCountry,
}: SubLocationZoomViewProps) {
  const renderIcon = (condition?: string) => {
    switch (condition) {
      case "rain":
        return <CloudRain className="h-6 w-6 text-blue-500 animate-bounce" />;
      case "thunder":
        return <Zap className="h-6 w-6 text-amber-500 animate-pulse" />;
      case "sun":
        return <Sun className="h-6 w-6 text-amber-400 animate-spin-slow" />;
      case "fog":
        return <CloudFog className="h-6 w-6 text-teal-400" />;
      case "cloud":
      default:
        return <Cloud className="h-6 w-6 text-slate-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface/90 backdrop-blur-xl p-5 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Micro-Climate Zoom
            </span>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              {district.name} ({district.nameSi})
            </h2>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Compare weather across sub-towns in {district.name} district
          </p>
        </div>
        <button
          onClick={onBackToCountry}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
        >
          ← Full Map View
        </button>
      </div>

      {/* Grid of Sub-locations */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {district.subLocations.map((sub) => {
          const weather = subLocationData[sub.id];
          const isSelected = selectedSubLocation?.id === sub.id;

          return (
            <motion.div
              key={sub.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectSubLocation(sub)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/40"
                  : "border-border/60 bg-surface-hover/40 hover:border-primary/50 hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-text text-sm">{sub.name}</h3>
                  </div>
                  <span className="text-xs text-text-muted font-medium">{sub.nameSi}</span>
                </div>
                {weather && renderIcon(weather.condition)}
              </div>

              {weather ? (
                <div className="mt-3 flex items-baseline justify-between border-t border-border/40 pt-2">
                  <div>
                    <span className="text-2xl font-black text-text">{weather.temp}°C</span>
                    <p className="text-xs font-semibold text-primary">{weather.description}</p>
                  </div>
                  <div className="text-right text-[11px] text-text-muted space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      <Droplets className="h-3 w-3 text-blue-400" />
                      <span>{weather.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Wind className="h-3 w-3 text-teal-400" />
                      <span>{weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-text-muted">Loading weather...</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Explanatory banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-3.5 text-xs text-text border border-primary/20 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-primary font-bold">Micro-Climate Active:</strong> Even within {district.name}, high-altitude areas or eastern borders can experience different weather simultaneously (e.g., rain in town while neighboring valleys remain dry).
        </p>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DistrictGeoData, SubLocation } from "@/lib/sriLankaGeoData";
import type { WeatherDataPoint } from "@/lib/weatherApi";
import {
  X, MapPin, Thermometer, Wind, Droplets, CloudRain,
  Sun, Cloud, Zap, CloudFog, ChevronRight, Compass,
  ArrowUpRight, TrendingUp, Navigation,
} from "lucide-react";

interface DistrictDetailDrawerProps {
  district: DistrictGeoData | null;
  districtWeather: WeatherDataPoint | null;
  subLocationWeather: Record<string, WeatherDataPoint>;
  selectedSubLocation: SubLocation | null;
  onSelectSubLocation: (sub: SubLocation) => void;
  onClose: () => void;
  selectedDate: string;
  selectedHour: number;
}

function WeatherIcon({ condition, size = 20 }: { condition?: string; size?: number }) {
  const cls = `shrink-0`;
  const s = { width: size, height: size };
  switch (condition) {
    case "rain":    return <CloudRain style={s} className={`${cls} text-blue-400`} />;
    case "thunder": return <Zap style={s} className={`${cls} text-amber-400 animate-pulse`} />;
    case "sun":     return <Sun style={s} className={`${cls} text-amber-300`} />;
    case "fog":     return <CloudFog style={s} className={`${cls} text-teal-300`} />;
    default:        return <Cloud style={s} className={`${cls} text-slate-300`} />;
  }
}

function conditionGradient(condition?: string): string {
  switch (condition) {
    case "rain":    return "from-blue-950 via-slate-900 to-slate-950";
    case "thunder": return "from-purple-950 via-slate-900 to-slate-950";
    case "sun":     return "from-amber-950 via-slate-900 to-slate-950";
    case "fog":     return "from-teal-950 via-slate-900 to-slate-950";
    default:        return "from-slate-800 via-slate-900 to-slate-950";
  }
}

function conditionAccent(condition?: string): string {
  switch (condition) {
    case "rain":    return "text-blue-400";
    case "thunder": return "text-purple-400";
    case "sun":     return "text-amber-300";
    case "fog":     return "text-teal-300";
    default:        return "text-slate-300";
  }
}

export function DistrictDetailDrawer({
  district,
  districtWeather,
  subLocationWeather,
  selectedSubLocation,
  onSelectSubLocation,
  onClose,
  selectedDate,
  selectedHour,
}: DistrictDetailDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top when district changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [district?.id]);

  const w = districtWeather;
  const accent = conditionAccent(w?.condition);
  const gradient = conditionGradient(w?.condition);

  return (
    <AnimatePresence>
      {district && (
        <motion.div
          key={district.id}
          initial={{ opacity: 0, y: "100%", scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: "100%", scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className={`relative w-full rounded-3xl border border-slate-700/80 bg-gradient-to-br ${gradient} shadow-2xl overflow-hidden`}
        >
          {/* ── Drawer header ───────────────────────────── */}
          <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
                <WeatherIcon condition={w?.condition} size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{district.name}</h2>
                  <span className="text-sm text-slate-400 font-medium">({district.nameSi})</span>
                </div>
                <p className={`text-sm font-semibold mt-0.5 ${accent}`}>
                  {w?.description || "Loading weather…"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Big temperature */}
              {w && (
                <div className="text-right">
                  <span className={`text-4xl font-black ${accent}`}>{w.temp}°</span>
                  <span className="text-base text-slate-400 font-bold">C</span>
                </div>
              )}
              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close district panel"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Scrollable content ─────────────────────── */}
          <div
            ref={scrollRef}
            className="max-h-[420px] overflow-y-auto overscroll-contain p-5 flex flex-col gap-5"
            // Stop wheel events here from bubbling to the map
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Quick stats row */}
            {w && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <Thermometer className="h-3.5 w-3.5" />, label: "Feels Like", value: `${w.temp - 1}°C` },
                  { icon: <Droplets className="h-3.5 w-3.5" />, label: "Humidity", value: `${w.humidity}%` },
                  { icon: <Wind className="h-3.5 w-3.5" />, label: "Wind", value: `${w.windSpeed} km/h` },
                  { icon: <CloudRain className="h-3.5 w-3.5" />, label: "Rain", value: `${w.precipitation} mm` },
                ].map((stat) => (
                  <div key={stat.label}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center">
                    <div className={`${accent}`}>{stat.icon}</div>
                    <span className="text-[10px] text-slate-500 font-semibold">{stat.label}</span>
                    <span className="text-sm font-black text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-locations grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                Towns & Villages in {district.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {district.subLocations.map((sub) => {
                  const sw = subLocationWeather[sub.id];
                  const isSel = selectedSubLocation?.id === sub.id;
                  return (
                    <motion.button
                      key={sub.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelectSubLocation(sub)}
                      className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all ${
                        isSel
                          ? "bg-primary/20 border-primary text-white ring-1 ring-primary/40"
                          : "bg-slate-800/50 border-slate-700/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <MapPin className={`h-3 w-3 shrink-0 ${isSel ? "text-primary" : "text-emerald-400"}`} />
                        <WeatherIcon condition={sw?.condition} size={14} />
                      </div>
                      <span className="text-[11px] font-bold leading-tight">{sub.name}</span>
                      <span className="text-[10px] text-slate-400">{sub.nameSi}</span>
                      {sw ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-sm font-black ${conditionAccent(sw.condition)}`}>{sw.temp}°C</span>
                          <span className="text-[9px] text-slate-500 truncate">{sw.description}</span>
                        </div>
                      ) : (
                        <div className="h-4 w-12 rounded bg-slate-700/60 animate-pulse mt-0.5" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date & time context */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-800/40 border border-slate-700/40 px-3 py-2 text-[11px] text-slate-400">
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Showing weather for <strong className="text-slate-200">{selectedDate}</strong> at <strong className="text-slate-200">{String(selectedHour).padStart(2, "0")}:00</strong></span>
              <span className="ml-auto text-slate-500">•</span>
              <span className="text-slate-500">Lat {district.centroid.lat.toFixed(2)}, Lng {district.centroid.lng.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SRI_LANKA_DISTRICTS, SubLocation } from "@/lib/sriLankaGeoData";
import { fetchBatchWeather, WeatherDataPoint } from "@/lib/weatherApi";
import { SriLankaWeatherMap } from "./SriLankaWeatherMap";
import { DistrictDetailDrawer } from "./DistrictDetailDrawer";
import { WeatherDateSlider } from "./WeatherDateSlider";
import { ThreeMonthOutlookView } from "./ThreeMonthOutlookView";
import {
  Search, Sparkles, MapPin, Navigation, Layers, RefreshCw,
} from "lucide-react";

export function WeatherDashboardView() {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedSubLocation, setSelectedSubLocation] = useState<SubLocation | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [viewMode, setViewMode] = useState<"condition" | "heatmap">("condition");
  const [weatherData, setWeatherData] = useState<Record<string, WeatherDataPoint>>({});
  const [subLocationWeatherData, setSubLocationWeatherData] = useState<Record<string, WeatherDataPoint>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load district-level weather
  const loadDistrictWeather = useCallback(async () => {
    setIsLoading(true);
    const locs = Object.values(SRI_LANKA_DISTRICTS).map((d) => ({
      id: d.id, name: d.name, lat: d.centroid.lat, lng: d.centroid.lng,
    }));
    const data = await fetchBatchWeather(locs, selectedDate, selectedHour);
    setWeatherData(data);
    setIsLoading(false);
  }, [selectedDate, selectedHour]);

  // Load sub-location weather when district is selected
  const loadSubLocationWeather = useCallback(async () => {
    if (!selectedDistrictId) { setSubLocationWeatherData({}); return; }
    const district = SRI_LANKA_DISTRICTS[selectedDistrictId];
    if (!district?.subLocations) return;
    const locs = district.subLocations.map((s) => ({
      id: s.id, name: s.name, lat: s.lat, lng: s.lng,
    }));
    const data = await fetchBatchWeather(locs, selectedDate, selectedHour);
    setSubLocationWeatherData(data);
  }, [selectedDistrictId, selectedDate, selectedHour]);

  useEffect(() => { loadDistrictWeather(); }, [loadDistrictWeather]);
  useEffect(() => { loadSubLocationWeather(); }, [loadSubLocationWeather]);

  const activeDistrictObj = selectedDistrictId ? SRI_LANKA_DISTRICTS[selectedDistrictId] : null;
  const activeDistrictWeather = selectedDistrictId ? weatherData[selectedDistrictId] : null;

  // 3-Month outlook location — sub-location > district > default Kotmale
  const outlookLat  = selectedSubLocation?.lat  ?? activeDistrictObj?.centroid.lat  ?? 7.0428;
  const outlookLng  = selectedSubLocation?.lng   ?? activeDistrictObj?.centroid.lng  ?? 80.595;
  const outlookName = selectedSubLocation?.name  ?? activeDistrictObj?.name          ?? "Kotmale (Maswela)";

  // Search dropdown
  const filteredDistricts = Object.values(SRI_LANKA_DISTRICTS).filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameSi.includes(searchQuery) ||
      d.subLocations.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text flex items-center gap-2">
            Sri Lanka Live Weather
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-text-muted">
            Click any district on the map to view weather details below
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick focus: Kotmale */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => {
              setSelectedDistrictId("LK23");
              setSelectedSubLocation({
                id: "kotmale_maswela", name: "Kotmale (Maswela)",
                nameSi: "කොත්මලේ (මස්වෙල)", lat: 7.0428, lng: 80.595,
              });
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Navigation className="h-4 w-4" />
            My Location (Kotmale)
          </motion.button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search district or town…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-60 rounded-2xl border border-border/80 bg-surface pl-9 pr-4 py-2 text-xs font-semibold text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && filteredDistricts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-2xl">
                {filteredDistricts.map((d) => (
                  <button key={d.id}
                    onClick={() => { setSelectedDistrictId(d.id); setSelectedSubLocation(null); setSearchQuery(""); }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium hover:bg-surface-hover">
                    <span className="font-bold text-text">{d.name} <span className="text-text-muted">({d.nameSi})</span></span>
                    <span className="text-primary text-[10px]">View →</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-2xl bg-surface-hover p-1 border border-border">
            <button onClick={() => setViewMode("condition")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${viewMode === "condition" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-text"}`}>
              Conditions
            </button>
            <button onClick={() => setViewMode("heatmap")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${viewMode === "heatmap" ? "bg-amber-500 text-white shadow-md" : "text-text-muted hover:text-text"}`}>
              Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout: Map (left) + Controls (right) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map — stays fixed, never auto-zooms on click */}
        <div className="lg:col-span-8">
          <SriLankaWeatherMap
            weatherData={weatherData}
            subLocationData={subLocationWeatherData}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={(id) => {
              setSelectedDistrictId(id);
              setSelectedSubLocation(null);
            }}
            selectedSubLocationId={selectedSubLocation?.id || null}
            onSelectSubLocation={(sub) => setSelectedSubLocation(sub)}
            viewMode={viewMode}
          />
        </div>

        {/* Right column: Date slider + hint card */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <WeatherDateSlider
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedHour={selectedHour}
            onHourChange={setSelectedHour}
          />

          {/* Hint card when nothing selected */}
          {!selectedDistrictId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/60 bg-surface/80 p-5 flex flex-col gap-3 text-center"
            >
              <MapPin className="h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-bold text-text">Click any district on the map</p>
              <p className="text-xs text-text-muted">
                A weather detail panel will open below the map. You can scroll through district towns independently without moving the map.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── District Detail Drawer (slides in below map when district clicked) ── */}
      <DistrictDetailDrawer
        district={activeDistrictObj}
        districtWeather={activeDistrictWeather}
        subLocationWeather={subLocationWeatherData}
        selectedSubLocation={selectedSubLocation}
        onSelectSubLocation={(sub) => setSelectedSubLocation(sub)}
        onClose={() => { setSelectedDistrictId(null); setSelectedSubLocation(null); }}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
      />

      {/* ── 3-Month Seasonal Outlook ─────────────────────────── */}
      <ThreeMonthOutlookView
        locationName={outlookName}
        lat={outlookLat}
        lng={outlookLng}
        onSelectDate={setSelectedDate}
      />
    </div>
  );
}

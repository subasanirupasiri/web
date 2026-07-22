"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SRI_LANKA_DISTRICTS, DistrictGeoData, SubLocation } from "@/lib/sriLankaGeoData";
import { fetchBatchWeather, WeatherDataPoint, WeatherEffectType } from "@/lib/weatherApi";
import { SriLankaWeatherMap } from "./SriLankaWeatherMap";
import { SubLocationZoomView } from "./SubLocationZoomView";
import { WeatherDateSlider } from "./WeatherDateSlider";
import { ThreeMonthOutlookView } from "./ThreeMonthOutlookView";
import {
  Sun,
  CloudRain,
  Cloud,
  Zap,
  CloudFog,
  Search,
  Thermometer,
  Wind,
  Droplets,
  CloudLightning,
  Compass,
  Layers,
  Sparkles,
  MapPin,
  RefreshCw,
  Navigation,
  Calendar,
} from "lucide-react";

export function WeatherDashboardView() {
  // Default to Nuwara Eliya (LK23) and Kotmale (Maswela) sub-location!
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>("LK23");
  const [selectedSubLocation, setSelectedSubLocation] = useState<SubLocation | null>({
    id: "kotmale_maswela",
    name: "Kotmale (Maswela)",
    nameSi: "කොත්මලේ (මස්වෙල)",
    lat: 7.0428,
    lng: 80.5950,
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [viewMode, setViewMode] = useState<"condition" | "heatmap">("condition");

  const [weatherData, setWeatherData] = useState<Record<string, WeatherDataPoint>>({});
  const [subLocationWeatherData, setSubLocationWeatherData] = useState<Record<string, WeatherDataPoint>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Handler for Quick Focus Kotmale (Maswela)
  const handleFocusKotmale = () => {
    setSelectedDistrictId("LK23");
    setSelectedSubLocation({
      id: "kotmale_maswela",
      name: "Kotmale (Maswela)",
      nameSi: "කොත්මලේ (මස්වෙල)",
      lat: 7.0428,
      lng: 80.5950,
    });
  };

  // Load district level weather batch data
  const loadDistrictWeather = useCallback(async () => {
    setIsLoading(true);
    const districtLocations = Object.values(SRI_LANKA_DISTRICTS).map((d) => ({
      id: d.id,
      name: d.name,
      lat: d.centroid.lat,
      lng: d.centroid.lng,
    }));

    const data = await fetchBatchWeather(districtLocations, selectedDate, selectedHour);
    setWeatherData(data);
    setIsLoading(false);
  }, [selectedDate, selectedHour]);

  // Load sub-location weather data for selected district
  const loadSubLocationWeather = useCallback(async () => {
    if (!selectedDistrictId) {
      setSubLocationWeatherData({});
      return;
    }

    const district = SRI_LANKA_DISTRICTS[selectedDistrictId];
    if (!district || !district.subLocations) return;

    const subLocs = district.subLocations.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
    }));

    const data = await fetchBatchWeather(subLocs, selectedDate, selectedHour);
    setSubLocationWeatherData(data);
  }, [selectedDistrictId, selectedDate, selectedHour]);

  useEffect(() => {
    loadDistrictWeather();
  }, [loadDistrictWeather]);

  useEffect(() => {
    loadSubLocationWeather();
  }, [loadSubLocationWeather]);

  const activeDistrictObj = selectedDistrictId ? SRI_LANKA_DISTRICTS[selectedDistrictId] : null;
  const activeDistrictWeather = selectedDistrictId ? weatherData[selectedDistrictId] : null;
  const activeSubWeather = selectedSubLocation ? subLocationWeatherData[selectedSubLocation.id] : null;

  const currentDisplayWeather = activeSubWeather || activeDistrictWeather;

  // Search filter across districts & sub-locations
  const filteredDistricts = Object.values(SRI_LANKA_DISTRICTS).filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameSi.includes(searchQuery) ||
      d.subLocations.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text flex items-center gap-2">
            Sri Lanka Live Weather & 3-Month Forecast
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-text-muted">
            Micro-climate tracking for Kotmale (Maswela), Nuwara Eliya & 25 districts with 90-day seasonal outlook
          </p>
        </div>

        {/* Search, My Location Button & View Mode Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Location Button for Kotmale (Maswela) */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFocusKotmale}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <Navigation className="h-4 w-4 animate-spin-slow" />
            Kotmale (Maswela)
          </motion.button>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search Kotmale, Nuwara Eliya, Kandy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-2xl border border-border/80 bg-surface pl-9 pr-4 py-2 text-xs font-semibold text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && filteredDistricts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-2xl">
                {filteredDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDistrictId(d.id);
                      setSelectedSubLocation(null);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium hover:bg-surface-hover"
                  >
                    <span className="font-bold text-text">{d.name} ({d.nameSi})</span>
                    <span className="text-primary text-[10px]">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-surface-hover p-1 border border-border">
            <button
              onClick={() => setViewMode("condition")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "condition"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Condition Overlay
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "heatmap"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Temp Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Selected Location Banner Card */}
      {activeDistrictObj && currentDisplayWeather && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl border border-slate-800"
        >
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedSubLocation ? "Local Sub-Town Climate" : "District Overview"}
                </span>
                <span className="text-xs text-slate-300">
                  {selectedDate} | {String(selectedHour).padStart(2, "0")}:00
                </span>
              </div>
              <h2 className="text-3xl font-black mt-2 text-white flex items-center gap-3">
                {selectedSubLocation ? selectedSubLocation.name : activeDistrictObj.name}
                <span className="text-lg font-normal text-slate-400">
                  ({selectedSubLocation ? selectedSubLocation.nameSi : activeDistrictObj.nameSi})
                </span>
              </h2>
              <p className="text-sm text-cyan-300 font-semibold mt-1">
                {currentDisplayWeather.description} ({currentDisplayWeather.descriptionSi})
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">
                  {currentDisplayWeather.temp}°
                </span>
                <span className="text-xl font-bold text-amber-400">C</span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-l border-slate-700/80 pl-6 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-400" />
                  <span>Humidity: <strong>{currentDisplayWeather.humidity}%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-teal-400" />
                  <span>Wind: <strong>{currentDisplayWeather.windSpeed} km/h</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-indigo-400" />
                  <span>Rain: <strong>{currentDisplayWeather.precipitation} mm</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-amber-400" />
                  <span>Day/Night: <strong>{currentDisplayWeather.isDay ? "Day" : "Night"}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sri Lanka Interactive Weather Map */}
        <div className="lg:col-span-8 flex flex-col gap-6">
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

        {/* Right Column: Sub-Location Zoom & Timeline Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Sub Location Zoom View (if district selected) */}
          {activeDistrictObj && (
            <SubLocationZoomView
              district={activeDistrictObj}
              subLocationData={subLocationWeatherData}
              selectedSubLocation={selectedSubLocation}
              onSelectSubLocation={(sub) => setSelectedSubLocation(sub)}
              onBackToCountry={() => {
                setSelectedDistrictId(null);
                setSelectedSubLocation(null);
              }}
            />
          )}

          {/* Date & Hour Timeline Slider */}
          <WeatherDateSlider
            selectedDate={selectedDate}
            onDateChange={(d) => setSelectedDate(d)}
            selectedHour={selectedHour}
            onHourChange={(h) => setSelectedHour(h)}
          />
        </div>
      </div>

      {/* 3-Month / 90-Day Seasonal Weather Outlook Section */}
      <ThreeMonthOutlookView
        locationName={selectedSubLocation ? selectedSubLocation.name : activeDistrictObj ? activeDistrictObj.name : "Kotmale (Maswela)"}
        lat={selectedSubLocation ? selectedSubLocation.lat : activeDistrictObj ? activeDistrictObj.centroid.lat : 7.0428}
        lng={selectedSubLocation ? selectedSubLocation.lng : activeDistrictObj ? activeDistrictObj.centroid.lng : 80.5950}
        onSelectDate={(dateStr) => setSelectedDate(dateStr)}
      />
    </div>
  );
}

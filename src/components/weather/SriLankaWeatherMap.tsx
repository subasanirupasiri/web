"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SRI_LANKA_DISTRICTS, SubLocation } from "@/lib/sriLankaGeoData";
import { SRI_LANKA_SVG_PATHS, DistrictPathData } from "@/lib/sriLankaSvgPaths";
import type { WeatherDataPoint, WeatherEffectType } from "@/lib/weatherApi";
import { fetchWeatherForGNDivisions } from "@/lib/weatherApi";
import { WeatherEffectsOverlay } from "./WeatherEffectsOverlay";
import { GNDivisionLayer } from "./GNDivisionLayer";
import {
  GNDivision,
  ViewportBounds,
  gnDivisionCache,
  svgToLatLng,
  latLngToSvg,
  distanceKm,
} from "@/lib/spatialCache";
import { fetchGNDivisionsInViewport, getCuratedGNForDistrict } from "@/lib/gnDivisionLoader";
import {
  Sun, Cloud, CloudRain, Zap, CloudFog, MapPin,
  ZoomIn, ZoomOut, RotateCcw, Move, Layers, Navigation,
} from "lucide-react";

// SVG canvas dimensions (matches the viewBox)
const SVG_W = 1000;
const SVG_H = 1000;

interface SriLankaWeatherMapProps {
  weatherData: Record<string, WeatherDataPoint>;
  subLocationData: Record<string, WeatherDataPoint>;
  selectedDistrictId: string | null;
  onSelectDistrict: (districtId: string | null) => void;
  selectedSubLocationId: string | null;
  onSelectSubLocation: (subLoc: SubLocation | null) => void;
  viewMode: "condition" | "heatmap";
}

// ─── Zoom-level thresholds ───
// Level 1 (< 2.0):  District shapes + weather badges
// Level 2 (2–3.5):  District shapes + sub-location town pins
// Level 3 (3.5–5):  GN Division mini dots (curated, near mouse)
// Level 4 (≥ 5.0):  GN Division full labels + Overpass live query
const LOD_DISTRICT = 2.0;
const LOD_GN_DOTS = 3.5;
const LOD_GN_FULL = 5.0;
const GN_PROXIMITY_KM = 5; // km radius for proximity highlight

export function SriLankaWeatherMap({
  weatherData, subLocationData,
  selectedDistrictId, onSelectDistrict,
  selectedSubLocationId, onSelectSubLocation,
  viewMode,
}: SriLankaWeatherMapProps) {
  const [paths, setPaths] = useState<DistrictPathData[]>(SRI_LANKA_SVG_PATHS);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);

  // GPU zoom/pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Cursor lat/lng for proximity detection
  const [cursorLatLng, setCursorLatLng] = useState<{ lat: number; lng: number } | null>(null);

  // Progressive GN Division data
  const [gnDivisions, setGnDivisions] = useState<GNDivision[]>([]);
  const [gnWeatherData, setGnWeatherData] = useState<Record<string, WeatherDataPoint>>({});
  const [gnLoading, setGnLoading] = useState(false);
  const [selectedGNId, setSelectedGNId] = useState<string | null>(null);

  // Refs
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const gnFetchAbortRef = useRef<AbortController | null>(null);
  const viewportFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load SVG paths from public file (falls back to embedded)
  useEffect(() => {
    fetch("/srilankasvg.txt")
      .then((r) => r.text())
      .then((text) => {
        const sanitized = text.replace(/<\?\s*xml[^>]*\?>/gi, "");
        const doc = new DOMParser().parseFromString(sanitized, "image/svg+xml");
        const els = doc.querySelectorAll("path");
        const parsed: DistrictPathData[] = [];
        els.forEach((el) => {
          const id = el.getAttribute("id") || "";
          const name = el.getAttribute("name") || "";
          const d = el.getAttribute("d") || "";
          if (id && d) parsed.push({ id, name, d });
        });
        if (parsed.length > 0) setPaths(parsed);
      })
      .catch(() => {});
  }, []);

  // Focus on selected district when changed
  useEffect(() => {
    if (selectedDistrictId && SRI_LANKA_DISTRICTS[selectedDistrictId]) {
      const geo = SRI_LANKA_DISTRICTS[selectedDistrictId];
      const targetPanX = (500 - geo.centroid.cx) * 0.8;
      const targetPanY = (500 - geo.centroid.cy) * 0.8;
      setZoomLevel(2.5);
      setPanOffset({ x: targetPanX, y: targetPanY });

      // Immediately load curated GN data for this district
      const curated = getCuratedGNForDistrict(selectedDistrictId);
      setGnDivisions((prev) => {
        const existing = new Set(prev.map((g) => g.id));
        const newOnes = curated.filter((g) => !existing.has(g.id));
        return [...prev, ...newOnes];
      });
    } else if (!selectedDistrictId) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [selectedDistrictId]);

  // Compute current viewport bounds in lat/lng
  const computeViewportBounds = useCallback((): ViewportBounds => {
    // At zoomLevel, each SVG unit covers 1/zoomLevel of screen
    const visibleW = SVG_W / zoomLevel;
    const visibleH = SVG_H / zoomLevel;
    const centerSvgX = SVG_W / 2 - panOffset.x / zoomLevel;
    const centerSvgY = SVG_H / 2 - panOffset.y / zoomLevel;

    const topLeft = svgToLatLng(centerSvgX - visibleW / 2, centerSvgY - visibleH / 2, SVG_W, SVG_H);
    const bottomRight = svgToLatLng(centerSvgX + visibleW / 2, centerSvgY + visibleH / 2, SVG_W, SVG_H);

    return {
      minLat: Math.min(topLeft.lat, bottomRight.lat),
      maxLat: Math.max(topLeft.lat, bottomRight.lat),
      minLng: Math.min(topLeft.lng, bottomRight.lng),
      maxLng: Math.max(topLeft.lng, bottomRight.lng),
    };
  }, [zoomLevel, panOffset]);

  // Fetch GN Divisions for current viewport when zoom >= LOD_GN_DOTS
  const fetchGNForViewport = useCallback(async () => {
    if (zoomLevel < LOD_GN_DOTS) return;

    const bounds = computeViewportBounds();
    const cacheKey = `${bounds.minLat.toFixed(2)}:${bounds.minLng.toFixed(2)}:${bounds.maxLat.toFixed(2)}:${bounds.maxLng.toFixed(2)}`;

    // Check if we already have data for this area in our local cache
    const cached = gnDivisionCache.get(cacheKey);
    if (cached) {
      setGnDivisions((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const newOnes = cached.filter((g) => !existingIds.has(g.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
      return;
    }

    // Cancel any in-flight request
    if (gnFetchAbortRef.current) gnFetchAbortRef.current.abort();
    const abortController = new AbortController();
    gnFetchAbortRef.current = abortController;

    setGnLoading(true);
    try {
      const divisions = await fetchGNDivisionsInViewport(bounds, abortController.signal);
      gnDivisionCache.set(cacheKey, divisions);
      setGnDivisions((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const newOnes = divisions.filter((g) => !existingIds.has(g.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    } catch {
      // Aborted or failed — silently ignore
    } finally {
      setGnLoading(false);
    }
  }, [zoomLevel, computeViewportBounds]);

  // Debounced viewport change → trigger GN fetch
  useEffect(() => {
    if (viewportFetchTimerRef.current) clearTimeout(viewportFetchTimerRef.current);
    viewportFetchTimerRef.current = setTimeout(fetchGNForViewport, 400);
    return () => {
      if (viewportFetchTimerRef.current) clearTimeout(viewportFetchTimerRef.current);
    };
  }, [fetchGNForViewport]);

  // Fetch weather for currently visible GN divisions (auto-fetch)
  useEffect(() => {
    if (gnDivisions.length === 0) return;

    const bounds = computeViewportBounds();
    const visibleGNs = gnDivisions.filter(
      (gn) =>
        gn.lat >= bounds.minLat && gn.lat <= bounds.maxLat &&
        gn.lng >= bounds.minLng && gn.lng <= bounds.maxLng
    );
    if (visibleGNs.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const hour = new Date().getHours();

    const abortCtrl = new AbortController();
    fetchWeatherForGNDivisions(visibleGNs, today, hour, abortCtrl.signal)
      .then((data) => setGnWeatherData((prev) => ({ ...prev, ...data })))
      .catch(() => {});

    return () => abortCtrl.abort();
  }, [gnDivisions, computeViewportBounds]);

  // ─── Zoom handlers ───
  const handleZoomIn = () => setZoomLevel((p) => Math.min(p * 1.35, 10));
  const handleZoomOut = () => setZoomLevel((p) => {
    const next = p / 1.35;
    if (next <= 1.05) { setPanOffset({ x: 0, y: 0 }); return 1; }
    return next;
  });
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    onSelectDistrict(null);
    onSelectSubLocation(null);
    setSelectedGNId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.deltaY < 0 ? handleZoomIn() : handleZoomOut();
  };

  // ─── Pan handlers ───
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    // Track cursor lat/lng for proximity
    if (svgContainerRef.current && zoomLevel >= LOD_GN_DOTS) {
      const rect = svgContainerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      // Map screen coords → SVG coords → lat/lng
      const svgX = (relX / rect.width) * SVG_W;
      const svgY = (relY / rect.height) * SVG_H;
      // Reverse the transform
      const unscaledX = (svgX - SVG_W / 2 - panOffset.x) / zoomLevel + SVG_W / 2;
      const unscaledY = (svgY - SVG_H / 2 - panOffset.y) / zoomLevel + SVG_H / 2;
      setCursorLatLng(svgToLatLng(unscaledX, unscaledY, SVG_W, SVG_H));
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => { setIsDragging(false); setCursorLatLng(null); };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  // ─── District color ───
  const getDistrictFill = (districtId: string) => {
    const data = weatherData[districtId];
    const isSelected = selectedDistrictId === districtId;
    const isHovered = hoveredDistrictId === districtId;

    if (viewMode === "heatmap" && data) {
      if (data.temp <= 18) return isSelected ? "#059669" : "#10b981";
      if (data.temp <= 23) return isSelected ? "#0d9488" : "#14b8a6";
      if (data.temp <= 27) return isSelected ? "#d97706" : "#f59e0b";
      return isSelected ? "#dc2626" : "#ef4444";
    }
    if (!data) return isSelected ? "#15803d" : "#22c55e";
    switch (data.condition) {
      case "rain":    return isSelected ? "#1d4ed8" : isHovered ? "#2563eb" : "#3b82f6";
      case "thunder": return isSelected ? "#6d28d9" : isHovered ? "#7c3aed" : "#8b5cf6";
      case "sun":     return isSelected ? "#d97706" : isHovered ? "#f59e0b" : "#fbbf24";
      case "fog":     return isSelected ? "#0f766e" : isHovered ? "#0d9488" : "#14b8a6";
      default:        return isSelected ? "#1e293b" : isHovered ? "#334155" : "#475569";
    }
  };

  const renderWeatherIcon = (condition?: WeatherEffectType, size = 18) => {
    switch (condition) {
      case "rain":    return <CloudRain style={{ width: size, height: size }} className="text-blue-300 animate-bounce" />;
      case "thunder": return <Zap style={{ width: size, height: size }} className="text-amber-300 animate-pulse" />;
      case "sun":     return <Sun style={{ width: size, height: size }} className="text-amber-400 animate-spin-slow" />;
      case "fog":     return <CloudFog style={{ width: size, height: size }} className="text-teal-200 animate-pulse" />;
      default:        return <Cloud style={{ width: size, height: size }} className="text-slate-200" />;
    }
  };

  const selectedDistrictObj = selectedDistrictId ? SRI_LANKA_DISTRICTS[selectedDistrictId] : null;

  // LOD label
  const lodLabel = zoomLevel >= LOD_GN_FULL
    ? "GN Division View (Full Labels)"
    : zoomLevel >= LOD_GN_DOTS
    ? "GN Division View (Pins Mode)"
    : zoomLevel >= LOD_DISTRICT
    ? "District + Sub-Towns"
    : "Island Overview";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl p-2 md:p-6 text-white select-none">

      {/* LOD Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 text-[11px] font-medium text-slate-300">
          <Layers className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>{lodLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-1">
          <Move className="h-3 w-3" />
          <span>Drag to pan • Scroll to zoom</span>
        </div>
        {gnLoading && (
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
            <span className="animate-spin">⏳</span> Loading GN Divisions…
          </div>
        )}
      </div>

      {/* Zoom Toolbar */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl">
        <button onClick={handleZoomIn} title="Zoom In"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-primary active:scale-95 transition-all shadow-md">
          <ZoomIn className="h-5 w-5" />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-primary active:scale-95 transition-all shadow-md">
          <ZoomOut className="h-5 w-5" />
        </button>
        <button onClick={handleResetZoom} title="Reset View"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-white active:scale-95 transition-all shadow-md">
          <RotateCcw className="h-5 w-5" />
        </button>
        <div className="text-[10px] font-black text-center text-amber-300 py-1 border-t border-slate-700/60">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Main Map Canvas */}
      <div
        ref={svgContainerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`relative aspect-[3/4] w-full max-w-3xl mx-auto flex items-center justify-center overflow-hidden cursor-${isDragging ? "grabbing" : "grab"}`}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "50% 50%",
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          className="h-full w-full flex items-center justify-center pointer-events-auto"
        >
          <svg viewBox="0 0 1000 1000" className="h-full w-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-visible">
            {/* ── Layer 0: District SVG Paths ── */}
            <g id="features">
              {paths.map((p) => {
                const isSelected = selectedDistrictId === p.id;
                const isHovered = hoveredDistrictId === p.id;
                return (
                  <motion.path
                    key={p.id}
                    d={p.d}
                    fill={getDistrictFill(p.id)}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 0.9}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={selectedDistrictId && !isSelected ? 0.45 : 1}
                    className="cursor-pointer transition-colors duration-200 hover:brightness-125"
                    onMouseEnter={() => setHoveredDistrictId(p.id)}
                    onMouseLeave={() => setHoveredDistrictId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedDistrictId === p.id) {
                        onSelectDistrict(null);
                        onSelectSubLocation(null);
                      } else {
                        onSelectDistrict(p.id);
                        onSelectSubLocation(null);
                        setSelectedGNId(null);
                      }
                    }}
                  />
                );
              })}
            </g>

            {/* ── Layer 1: District Weather Badges (LOD: island view, zoom < 2) ── */}
            {zoomLevel < LOD_DISTRICT && (
              <g id="district_labels">
                {Object.values(SRI_LANKA_DISTRICTS).map((geo) => {
                  const weather = weatherData[geo.id];
                  return (
                    <foreignObject
                      key={geo.id}
                      x={geo.centroid.cx - 45}
                      y={geo.centroid.cy - 20}
                      width="90" height="42"
                      className="pointer-events-none overflow-visible"
                    >
                      <div
                        className="flex flex-col items-center justify-center rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2 py-1 shadow-2xl text-[10px] font-bold text-white cursor-pointer pointer-events-auto transition-transform hover:scale-110"
                        onClick={(e) => { e.stopPropagation(); onSelectDistrict(geo.id); }}
                      >
                        <div className="flex items-center gap-1">
                          {renderWeatherIcon(weather?.condition, 14)}
                          <span className="text-xs font-black text-amber-300">
                            {weather ? `${weather.temp}°C` : "--"}
                          </span>
                        </div>
                        <span className="truncate max-w-[80px] text-[9px] text-slate-300 font-medium">{geo.name}</span>
                      </div>
                    </foreignObject>
                  );
                })}
              </g>
            )}

            {/* ── Layer 2: Sub-location town pins (LOD: zoom 2–3.5, district selected) ── */}
            {zoomLevel >= LOD_DISTRICT && zoomLevel < LOD_GN_DOTS && selectedDistrictId && selectedDistrictObj && (
              <g id="sub_location_pins">
                {selectedDistrictObj.subLocations.map((sub, index) => {
                  const subWeather = subLocationData[sub.id];
                  const isSelectedSub = selectedSubLocationId === sub.id;
                  const { x, y } = latLngToSvg(sub.lat, sub.lng, SVG_W, SVG_H);

                  return (
                    <foreignObject key={sub.id} x={x - 52} y={y - 28} width="104" height="56"
                      className="pointer-events-none overflow-visible">
                      <motion.div
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        onClick={(e) => { e.stopPropagation(); onSelectSubLocation(sub); }}
                        className={`flex flex-col items-center justify-center rounded-2xl p-1.5 shadow-2xl backdrop-blur-lg border cursor-pointer pointer-events-auto transition-all duration-200 hover:scale-110 ${
                          isSelectedSub
                            ? "bg-primary text-white border-white ring-4 ring-primary/40"
                            : "bg-slate-900/95 text-white border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <MapPin className={`h-3 w-3 ${isSelectedSub ? "text-white" : "text-emerald-400"}`} />
                          <span className="text-xs font-black text-amber-300">
                            {subWeather ? `${subWeather.temp}°C` : "--°C"}
                          </span>
                          {subWeather && renderWeatherIcon(subWeather.condition, 14)}
                        </div>
                        <span className="truncate max-w-[90px] text-[10px] font-bold">{sub.name}</span>
                        {subWeather && (
                          <span className={`text-[8px] truncate max-w-[85px] ${isSelectedSub ? "text-white/80" : "text-cyan-300"}`}>
                            {subWeather.description}
                          </span>
                        )}
                      </motion.div>
                    </foreignObject>
                  );
                })}
              </g>
            )}

            {/* ── Layer 3: GN Division Pins (LOD: zoom ≥ 3.5) ── */}
            {zoomLevel >= LOD_GN_DOTS && (
              <GNDivisionLayer
                gnDivisions={gnDivisions}
                weatherData={gnWeatherData}
                isLoading={gnLoading}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                svgWidth={SVG_W}
                svgHeight={SVG_H}
                cursorLatLng={cursorLatLng}
                proximityRadiusKm={GN_PROXIMITY_KM}
                selectedGNId={selectedGNId}
                onSelectGN={(gn) => {
                  setSelectedGNId(gn.id);
                  onSelectSubLocation({
                    id: gn.id,
                    name: gn.name,
                    nameSi: gn.nameSi || gn.name,
                    lat: gn.lat,
                    lng: gn.lng,
                  });
                }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Weather Effects Overlay */}
      {selectedDistrictId && weatherData[selectedDistrictId] && (
        <WeatherEffectsOverlay effect={weatherData[selectedDistrictId].condition} intensity="high" />
      )}

      {/* Selected GN Info Tooltip */}
      <AnimatePresence>
        {selectedGNId && gnWeatherData[selectedGNId] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl bg-slate-900/95 border border-slate-700 px-4 py-2.5 shadow-2xl backdrop-blur-xl text-white text-xs font-bold"
          >
            <Navigation className="h-4 w-4 text-emerald-400" />
            <span>{gnDivisions.find((g) => g.id === selectedGNId)?.name}</span>
            <span className="text-amber-300">{gnWeatherData[selectedGNId].temp}°C</span>
            <span className="text-slate-400">{gnWeatherData[selectedGNId].description}</span>
            <button onClick={() => setSelectedGNId(null)} className="text-slate-500 hover:text-white ml-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SRI_LANKA_DISTRICTS, SubLocation } from "@/lib/sriLankaGeoData";
import { SRI_LANKA_SVG_PATHS, DistrictPathData } from "@/lib/sriLankaSvgPaths";
import type { WeatherDataPoint, WeatherEffectType } from "@/lib/weatherApi";
import { fetchWeatherForGNDivisions } from "@/lib/weatherApi";
import { WeatherEffectsOverlay } from "./WeatherEffectsOverlay";
import { GNDivisionLayer } from "./GNDivisionLayer";
import { GNDivision, ViewportBounds, gnDivisionCache } from "@/lib/spatialCache";
import { fetchGNDivisionsInViewport, getCuratedGNForDistrict } from "@/lib/gnDivisionLoader";
import {
  Sun, Cloud, CloudRain, Zap, CloudFog, MapPin,
  ZoomIn, ZoomOut, RotateCcw, Layers, Navigation,
} from "lucide-react";

// ─── SVG canvas viewBox size ───────────────────────────────────────
const SVG_W = 1000;
const SVG_H = 1000;

// ─── Calibrated Sri Lanka SVG ↔ Lat/Lng mapping ────────────────────
// Reference points derived from known district centroids:
//   Jaffna:       cx=377.9, cy=81.3  → lat=9.6615, lng=80.0255
//   Galle:        cx=375.2, cy=890.9 → lat=6.0535, lng=80.2210
//   Colombo:      cx=310.9, cy=740.3 → lat=6.9271, lng=79.8612
//   Nuwara Eliya: cx=485.0, cy=707.2 → lat=6.9497, lng=80.7891
const LAT_AT_CY0 = 9.9988;         // lat when cy = 0
const LAT_PER_PX = 0.004149;        // degrees latitude per SVG pixel (y-axis)
const LNG_ORIGIN = 79.8612;         // lng when cx = 310.9
const LNG_OFFSET_CX = 310.9;
const LNG_PER_PX = 0.005329;        // degrees longitude per SVG pixel (x-axis)

function svgXYToLatLng(cx: number, cy: number): { lat: number; lng: number } {
  return {
    lat: LAT_AT_CY0 - cy * LAT_PER_PX,
    lng: LNG_ORIGIN + (cx - LNG_OFFSET_CX) * LNG_PER_PX,
  };
}

function latLngToSvgXY(lat: number, lng: number): { x: number; y: number } {
  return {
    x: LNG_OFFSET_CX + (lng - LNG_ORIGIN) / LNG_PER_PX,
    y: (LAT_AT_CY0 - lat) / LAT_PER_PX,
  };
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── LOD thresholds ────────────────────────────────────────────────
// 1.0–1.8: Island overview  — 25 district weather badges
// 1.8–3.0: District zoom    — sub-town pins appear
// 3.0–5.0: GN dot mode      — GN Division dots, curated data
// ≥ 5.0  : GN full labels   — named pins + Overpass live fetch
const LOD_SUBTOWNS = 1.8;
const LOD_GN_DOTS  = 3.0;
const LOD_GN_FULL  = 5.0;
const GN_PROXIMITY_KM = 5;

interface SriLankaWeatherMapProps {
  weatherData: Record<string, WeatherDataPoint>;
  subLocationData: Record<string, WeatherDataPoint>;
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string | null) => void;
  selectedSubLocationId: string | null;
  onSelectSubLocation: (sub: SubLocation | null) => void;
  viewMode: "condition" | "heatmap";
}

export function SriLankaWeatherMap({
  weatherData, subLocationData,
  selectedDistrictId, onSelectDistrict,
  selectedSubLocationId, onSelectSubLocation,
  viewMode,
}: SriLankaWeatherMapProps) {
  const [paths, setPaths] = useState<DistrictPathData[]>(SRI_LANKA_SVG_PATHS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Zoom / Pan state ──────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(1);      // live ref avoids stale closures in wheel handler
  const panRef  = useRef({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // ── GN Division state ─────────────────────────────────────────────
  const [gnDivisions, setGnDivisions]   = useState<GNDivision[]>([]);
  const [gnWeather,   setGnWeather]     = useState<Record<string, WeatherDataPoint>>({});
  const [gnLoading,   setGnLoading]     = useState(false);
  const [selectedGNId, setSelectedGNId] = useState<string | null>(null);
  const [cursorLatLng, setCursorLatLng] = useState<{ lat: number; lng: number } | null>(null);

  const containerRef      = useRef<HTMLDivElement>(null);
  const gnAbortRef        = useRef<AbortController | null>(null);
  const gnFetchTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync refs with state ──────────────────────────────────────────
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  // ── Load SVG paths from public file ──────────────────────────────
  useEffect(() => {
    fetch("/srilankasvg.txt")
      .then((r) => r.text())
      .then((text) => {
        const sanitized = text.replace(/<\?\s*xml[^>]*\?>/gi, "");
        const doc = new DOMParser().parseFromString(sanitized, "image/svg+xml");
        const parsed: DistrictPathData[] = [];
        doc.querySelectorAll("path").forEach((el) => {
          const id = el.getAttribute("id") || "";
          const d  = el.getAttribute("d")  || "";
          if (id && d) parsed.push({ id, name: el.getAttribute("name") || "", d });
        });
        if (parsed.length > 0) setPaths(parsed);
      })
      .catch(() => {});
  }, []);

  // ── Preload curated GN data when district selected (no auto-zoom) ──
  // Map stays in place — district detail opens in bottom drawer instead.
  useEffect(() => {
    if (!selectedDistrictId) return;
    const curated = getCuratedGNForDistrict(selectedDistrictId);
    setGnDivisions((prev) => {
      const ids = new Set(prev.map((g) => g.id));
      return [...prev, ...curated.filter((g) => !ids.has(g.id))];
    });
  }, [selectedDistrictId]);


  // ── Compute viewport lat/lng bounds from zoom + pan ───────────────
  const getViewportBounds = useCallback((): ViewportBounds => {
    const z = zoomRef.current;
    const p = panRef.current;
    // Visible SVG region: the transform is translate(p) scale(z) from center
    // So visible SVG coords range from:
    const halfW = SVG_W / (2 * z);
    const halfH = SVG_H / (2 * z);
    const centerSvgX = SVG_W / 2 - p.x / z;
    const centerSvgY = SVG_H / 2 - p.y / z;

    const tl = svgXYToLatLng(centerSvgX - halfW, centerSvgY - halfH);
    const br = svgXYToLatLng(centerSvgX + halfW, centerSvgY + halfH);
    return {
      minLat: Math.min(tl.lat, br.lat),
      maxLat: Math.max(tl.lat, br.lat),
      minLng: Math.min(tl.lng, br.lng),
      maxLng: Math.max(tl.lng, br.lng),
    };
  }, []);

  // ── Fetch GN Divisions for viewport (debounced) ───────────────────
  const doFetchGN = useCallback(async () => {
    if (zoomRef.current < LOD_GN_DOTS) return;
    const bounds = getViewportBounds();
    const key = `${bounds.minLat.toFixed(2)}:${bounds.minLng.toFixed(2)}:${bounds.maxLat.toFixed(2)}:${bounds.maxLng.toFixed(2)}`;
    const cached = gnDivisionCache.get(key);
    if (cached) {
      setGnDivisions((prev) => {
        const ids = new Set(prev.map((g) => g.id));
        const fresh = cached.filter((g) => !ids.has(g.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
      return;
    }
    if (gnAbortRef.current) gnAbortRef.current.abort();
    const ctrl = new AbortController();
    gnAbortRef.current = ctrl;
    setGnLoading(true);
    try {
      const divs = await fetchGNDivisionsInViewport(bounds, ctrl.signal);
      gnDivisionCache.set(key, divs);
      setGnDivisions((prev) => {
        const ids = new Set(prev.map((g) => g.id));
        const fresh = divs.filter((g) => !ids.has(g.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    } catch { /* aborted */ } finally {
      setGnLoading(false);
    }
  }, [getViewportBounds]);

  // Debounce GN fetch on zoom/pan change
  const scheduleFetch = useCallback(() => {
    if (gnFetchTimerRef.current) clearTimeout(gnFetchTimerRef.current);
    gnFetchTimerRef.current = setTimeout(doFetchGN, 350);
  }, [doFetchGN]);

  useEffect(() => {
    scheduleFetch();
    return () => { if (gnFetchTimerRef.current) clearTimeout(gnFetchTimerRef.current); };
  }, [zoom, pan, scheduleFetch]);

  // ── Auto-fetch weather for visible GN pins ────────────────────────
  useEffect(() => {
    if (gnDivisions.length === 0 || zoom < LOD_GN_DOTS) return;
    const bounds = getViewportBounds();
    const visible = gnDivisions.filter(
      (g) => g.lat >= bounds.minLat && g.lat <= bounds.maxLat &&
             g.lng >= bounds.minLng && g.lng <= bounds.maxLng
    );
    if (visible.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const hour  = new Date().getHours();
    const ctrl  = new AbortController();
    fetchWeatherForGNDivisions(visible, today, hour, ctrl.signal)
      .then((d) => setGnWeather((prev) => ({ ...prev, ...d })))
      .catch(() => {});
    return () => ctrl.abort();
  }, [gnDivisions, zoom, getViewportBounds]);

  // ── Zoom button handlers (button-click, not cursor-anchored) ──────
  const applyZoom = useCallback((factor: number) => {
    setZoom((z) => {
      const next = Math.max(1, Math.min(10, z * factor));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // ── Mouse-wheel handler — cursor-anchored zoom ────────────────────
  // NOTE: We use a direct DOM listener (non-passive) via useEffect below
  // so that e.preventDefault() actually stops the page from scrolling.
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();  // stop page scroll — only works in non-passive listener
    if (!containerRef.current) return;

    const rect   = containerRef.current.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const oldZ   = zoomRef.current;
    const newZ   = Math.max(1, Math.min(10, oldZ * factor));
    if (newZ === oldZ) return;

    // Mouse position relative to container center (in px)
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top  - rect.height / 2;

    // Pan so the point under the cursor stays fixed:
    // newPan = oldPan × (newZ/oldZ) + cursorOffset × (1 − newZ/oldZ)
    const ratio = newZ / oldZ;
    const oldP  = panRef.current;
    setZoom(newZ);
    setPan({ x: oldP.x * ratio + mx * (1 - ratio), y: oldP.y * ratio + my * (1 - ratio) });
  }, []);

  // Attach non-passive wheel listener to the container element
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelNative);
  }, [handleWheelNative]);

  // ── Drag-pan handlers ─────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const dx = e.clientX - dragStartRef.current.mx;
      const dy = e.clientY - dragStartRef.current.my;
      setPan({ x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy });
    }

    // Track cursor for GN proximity highlight
    if (containerRef.current && zoomRef.current >= LOD_GN_DOTS) {
      const rect = containerRef.current.getBoundingClientRect();
      // Screen → SVG coordinates (reverse the CSS transform)
      const sx = e.clientX - rect.left - rect.width  / 2;
      const sy = e.clientY - rect.top  - rect.height / 2;
      const svgX = SVG_W / 2 + (sx - panRef.current.x) / zoomRef.current;
      const svgY = SVG_H / 2 + (sy - panRef.current.y) / zoomRef.current;
      setCursorLatLng(svgXYToLatLng(svgX, svgY));
    } else {
      setCursorLatLng(null);
    }
  }, [dragging]);

  const handleMouseUp   = useCallback(() => setDragging(false), []);
  const handleMouseLeave = useCallback(() => { setDragging(false); setCursorLatLng(null); }, []);

  // Touch pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      dragStartRef.current = {
        mx: e.touches[0].clientX, my: e.touches[0].clientY,
        px: panRef.current.x, py: panRef.current.y,
      };
    }
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.mx;
    const dy = e.touches[0].clientY - dragStartRef.current.my;
    setPan({ x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy });
  }, [dragging]);

  const handleReset = () => {
    setZoom(1); setPan({ x: 0, y: 0 });
    onSelectDistrict(null); onSelectSubLocation(null); setSelectedGNId(null);
  };

  // ── District fill color ──────────────────────────────────────────
  const getDistrictFill = (id: string) => {
    const d = weatherData[id];
    const sel = selectedDistrictId === id;
    const hov = hoveredId === id;
    if (viewMode === "heatmap" && d) {
      if (d.temp <= 18) return sel ? "#059669" : "#10b981";
      if (d.temp <= 23) return sel ? "#0d9488" : "#14b8a6";
      if (d.temp <= 27) return sel ? "#d97706" : "#f59e0b";
      return sel ? "#dc2626" : "#ef4444";
    }
    if (!d) return sel ? "#15803d" : "#22c55e";
    switch (d.condition) {
      case "rain":    return sel ? "#1d4ed8" : hov ? "#2563eb" : "#3b82f6";
      case "thunder": return sel ? "#6d28d9" : hov ? "#7c3aed" : "#8b5cf6";
      case "sun":     return sel ? "#d97706" : hov ? "#f59e0b" : "#fbbf24";
      case "fog":     return sel ? "#0f766e" : hov ? "#0d9488" : "#14b8a6";
      default:        return sel ? "#1e293b" : hov ? "#334155" : "#475569";
    }
  };

  const renderWIcon = (cond?: WeatherEffectType, size = 18) => {
    const s = { width: size, height: size };
    switch (cond) {
      case "rain":    return <CloudRain style={s} className="text-blue-300 animate-bounce" />;
      case "thunder": return <Zap style={s} className="text-amber-300 animate-pulse" />;
      case "sun":     return <Sun style={s} className="text-amber-400 animate-spin-slow" />;
      case "fog":     return <CloudFog style={s} className="text-teal-200 animate-pulse" />;
      default:        return <Cloud style={s} className="text-slate-200" />;
    }
  };

  const selDistrict = selectedDistrictId ? SRI_LANKA_DISTRICTS[selectedDistrictId] : null;

  const lodLabel =
    zoom >= LOD_GN_FULL  ? "GN Division — Full Labels" :
    zoom >= LOD_GN_DOTS  ? "GN Division — Pins Mode"   :
    zoom >= LOD_SUBTOWNS ? "District + Sub-Towns"       :
    "Island Overview";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl text-white select-none">

      {/* ── LOD indicator ──────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 text-[11px] font-semibold text-slate-200">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {lodLabel}
        </div>
        <div className="text-[10px] text-slate-500 pl-1">Scroll to zoom • Drag to pan</div>
        {gnLoading && (
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            <span className="animate-spin inline-block">⏳</span> Loading nearby villages…
          </div>
        )}
      </div>

      {/* ── Zoom toolbar ──────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
        <button onClick={() => applyZoom(1.4)} title="Zoom In (+)"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-primary active:scale-90 transition-all shadow-md">
          <ZoomIn className="h-4.5 w-4.5" />
        </button>
        <button onClick={() => applyZoom(1 / 1.4)} title="Zoom Out (-)"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-primary active:scale-90 transition-all shadow-md">
          <ZoomOut className="h-4.5 w-4.5" />
        </button>
        <button onClick={handleReset} title="Reset"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-white active:scale-90 transition-all shadow-md">
          <RotateCcw className="h-4.5 w-4.5" />
        </button>
        <div className="text-[9px] font-black text-center text-amber-300 pt-0.5 border-t border-slate-700/60">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* ── Main canvas ──────────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`relative aspect-[3/4] w-full max-w-3xl mx-auto overflow-hidden cursor-${dragging ? "grabbing" : "grab"}`}
        style={{ touchAction: "none" }}
      >
        {/* GPU-accelerated transform layer */}
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "50% 50%",
            transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 1000 1000"
            className="h-full w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] overflow-visible"
          >
            {/* ── Layer 0: District fills ── */}
            <g id="district-fills">
              {paths.map((p) => (
                <motion.path
                  key={p.id}
                  d={p.d}
                  fill={getDistrictFill(p.id)}
                  stroke="#fff"
                  strokeWidth={selectedDistrictId === p.id ? 2.5 : 0.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={selectedDistrictId && selectedDistrictId !== p.id ? 0.4 : 1}
                  className="cursor-pointer hover:brightness-125 transition-colors duration-150"
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedDistrictId === p.id) {
                      onSelectDistrict(null); onSelectSubLocation(null);
                    } else {
                      onSelectDistrict(p.id); onSelectSubLocation(null); setSelectedGNId(null);
                    }
                  }}
                />
              ))}
            </g>

            {/* ── Layer 1: District weather badges (island overview, zoom < 1.8) ── */}
            {zoom < LOD_SUBTOWNS && (
              <g id="district-badges">
                {Object.values(SRI_LANKA_DISTRICTS).map((geo) => {
                  const w = weatherData[geo.id];
                  return (
                    <foreignObject key={geo.id} x={geo.centroid.cx - 44} y={geo.centroid.cy - 19}
                      width="88" height="40" className="pointer-events-none overflow-visible">
                      <div
                        className="flex flex-col items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold text-white cursor-pointer pointer-events-auto transition-transform hover:scale-110"
                        onClick={(e) => { e.stopPropagation(); onSelectDistrict(geo.id); }}
                      >
                        <div className="flex items-center gap-1">
                          {renderWIcon(w?.condition, 12)}
                          <span className="text-amber-300 font-black">{w ? `${w.temp}°C` : "--"}</span>
                        </div>
                        <span className="truncate max-w-[76px] text-slate-300 text-[8px]">{geo.name}</span>
                      </div>
                    </foreignObject>
                  );
                })}
              </g>
            )}

            {/* ── Layer 2: Sub-town pins (zoom 1.8–3.0, district selected) ── */}
            {zoom >= LOD_SUBTOWNS && zoom < LOD_GN_DOTS && selDistrict && (
              <g id="sub-town-pins">
                {selDistrict.subLocations.map((sub, i) => {
                  const sw = subLocationData[sub.id];
                  const isSel = selectedSubLocationId === sub.id;
                  const { x, y } = latLngToSvgXY(sub.lat, sub.lng);
                  return (
                    <foreignObject key={sub.id} x={x - 52} y={y - 30} width="104" height="60"
                      className="pointer-events-none overflow-visible">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                        onClick={(e) => { e.stopPropagation(); onSelectSubLocation(sub); }}
                        className={`flex flex-col items-center gap-0.5 rounded-2xl p-1.5 shadow-xl border cursor-pointer pointer-events-auto transition-all hover:scale-105 ${
                          isSel
                            ? "bg-primary text-white border-white ring-2 ring-primary/50"
                            : "bg-slate-900/95 text-white border-slate-600 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <MapPin className={`h-3 w-3 ${isSel ? "text-white" : "text-emerald-400"}`} />
                          <span className="text-[11px] font-black text-amber-300">
                            {sw ? `${sw.temp}°C` : "--°C"}
                          </span>
                          {sw && renderWIcon(sw.condition, 12)}
                        </div>
                        <span className="truncate max-w-[90px] text-[9px] font-bold">{sub.name}</span>
                        {sw && <span className="text-[8px] text-cyan-300 truncate max-w-[85px]">{sw.description}</span>}
                      </motion.div>
                    </foreignObject>
                  );
                })}
              </g>
            )}

            {/* ── Layer 3: GN Division pins (zoom ≥ 3.0) ── */}
            {zoom >= LOD_GN_DOTS && (
              <GNDivisionLayerSVG
                gnDivisions={gnDivisions}
                weatherData={gnWeather}
                isLoading={gnLoading}
                zoom={zoom}
                cursorLatLng={cursorLatLng}
                proximityKm={GN_PROXIMITY_KM}
                selectedGNId={selectedGNId}
                onSelect={(gn) => {
                  setSelectedGNId(gn.id);
                  onSelectSubLocation({ id: gn.id, name: gn.name, nameSi: gn.nameSi || gn.name, lat: gn.lat, lng: gn.lng });
                }}
                latLngToSvgXY={latLngToSvgXY}
                distanceKm={distanceKm}
              />
            )}
          </svg>
        </div>
      </div>

      {/* ── Weather ambient overlay ─────────────────────────── */}
      {selectedDistrictId && weatherData[selectedDistrictId] && (
        <WeatherEffectsOverlay effect={weatherData[selectedDistrictId].condition} intensity="high" />
      )}

      {/* ── Selected GN tooltip bar ─────────────────────────── */}
      <AnimatePresence>
        {selectedGNId && gnWeather[selectedGNId] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl bg-slate-900/95 border border-slate-700 px-4 py-2.5 shadow-2xl backdrop-blur-xl text-white text-xs font-bold"
          >
            <Navigation className="h-4 w-4 text-emerald-400" />
            <span>{gnDivisions.find((g) => g.id === selectedGNId)?.name}</span>
            <span className="text-amber-300">{gnWeather[selectedGNId].temp}°C</span>
            <span className="text-slate-400">{gnWeather[selectedGNId].description}</span>
            <button onClick={() => setSelectedGNId(null)} className="ml-1 text-slate-500 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline GN SVG Layer (avoids prop-drilling SVG utility fns) ────
function GNDivisionLayerSVG({
  gnDivisions, weatherData, isLoading, zoom, cursorLatLng,
  proximityKm, selectedGNId, onSelect, latLngToSvgXY, distanceKm,
}: {
  gnDivisions: GNDivision[];
  weatherData: Record<string, WeatherDataPoint>;
  isLoading: boolean;
  zoom: number;
  cursorLatLng: { lat: number; lng: number } | null;
  proximityKm: number;
  selectedGNId: string | null;
  onSelect: (gn: GNDivision) => void;
  latLngToSvgXY: (lat: number, lng: number) => { x: number; y: number };
  distanceKm: (a: number, b: number, c: number, d: number) => number;
}) {
  const showFull = zoom >= 5.0;

  const condColor = (c?: string) => ({
    sun: "#f59e0b", rain: "#3b82f6", thunder: "#8b5cf6", fog: "#6b7280",
  }[c || ""] || "#94a3b8");

  const condEmoji = (c?: string) => ({
    sun: "☀️", rain: "🌧️", thunder: "⛈️", fog: "🌫️",
  }[c || ""] || "☁️");

  return (
    <g id="gn-layer">
      {gnDivisions.map((gn) => {
        const { x, y } = latLngToSvgXY(gn.lat, gn.lng);
        // Basic viewport culling (SVG space 0–1000)
        if (x < -50 || x > 1050 || y < -50 || y > 1050) return null;

        const dist = cursorLatLng
          ? distanceKm(cursorLatLng.lat, cursorLatLng.lng, gn.lat, gn.lng)
          : Infinity;
        const isNear   = dist <= proximityKm;
        const isVNear  = dist <= proximityKm * 0.35;
        const isSel    = selectedGNId === gn.id;
        const w        = weatherData[gn.id];
        const color    = condColor(w?.condition);
        const emoji    = condEmoji(w?.condition);

        if (!showFull) {
          // Dot mode
          return (
            <g key={gn.id} transform={`translate(${x},${y})`}
              onClick={() => onSelect(gn)} style={{ cursor: "pointer" }}>
              {isNear && (
                <circle r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.35">
                  <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={isNear ? 5 : isVNear ? 7 : 3} fill={color}
                opacity={isNear ? 1 : 0.55} stroke={isNear ? "white" : "none"} strokeWidth="1" />
              {isNear && w && (
                <text x="7" y="4" fontSize="8" fontWeight="700" fill="white"
                  fontFamily="system-ui,sans-serif">{w.temp}°C</text>
              )}
            </g>
          );
        }

        // Full label mode
        const lw = isSel || isNear ? 94 : 70;
        const lh = isSel || isNear ? 30 : 20;
        return (
          <g key={gn.id} transform={`translate(${x},${y})`}
            onClick={() => onSelect(gn)} style={{ cursor: "pointer" }}>
            {isNear && (
              <circle r="16" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="12;20;12" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <rect x={-lw / 2} y={-(lh + 8)} width={lw} height={lh} rx="6"
              fill={isSel ? color : "#0f172a"} fillOpacity="0.92"
              stroke={color} strokeWidth={isSel ? 2 : isNear ? 1.5 : 0.8} />
            <text x={-lw / 2 + 6} y={-(lh + 8) + 10} fontSize="8" fontWeight="700"
              fill="white" fontFamily="system-ui,sans-serif">
              {emoji} {gn.name.slice(0, 12)}
            </text>
            {w && (
              <text x={-lw / 2 + 6} y={-(lh + 8) + 21} fontSize="7.5" fontWeight="900"
                fill={color} fontFamily="system-ui,sans-serif">{w.temp}°C · {w.description.slice(0, 14)}</text>
            )}
            <line x1="0" y1="-8" x2="0" y2="0" stroke={color} strokeWidth="1.5" />
            <circle r={isSel ? 4 : 2.5} fill={color} stroke="white" strokeWidth="1" />
          </g>
        );
      })}
    </g>
  );
}

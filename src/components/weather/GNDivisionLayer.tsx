"use client";

/**
 * GNDivisionLayer — Renders GN Division weather pins on the SVG map canvas.
 * Only shows pins visible within the current viewport, uses proximity highlighting
 * to emphasize divisions near the mouse cursor (within ~5km radius).
 *
 * Fades in pins progressively as weather data loads.
 */

import { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GNDivision, latLngToSvg, distanceKm } from "@/lib/spatialCache";
import type { WeatherDataPoint } from "@/lib/weatherApi";
import { Sun, Cloud, CloudRain, Zap, CloudFog } from "lucide-react";

interface GNDivisionLayerProps {
  gnDivisions: GNDivision[];
  weatherData: Record<string, WeatherDataPoint>;
  isLoading: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  svgWidth: number;
  svgHeight: number;
  cursorLatLng: { lat: number; lng: number } | null;
  proximityRadiusKm: number; // default 5km
  selectedGNId: string | null;
  onSelectGN: (gn: GNDivision) => void;
}

function getConditionEmoji(condition?: string): string {
  switch (condition) {
    case "sun": return "☀️";
    case "rain": return "🌧️";
    case "thunder": return "⛈️";
    case "fog": return "🌫️";
    case "cloud":
    default: return "☁️";
  }
}

function getConditionColor(condition?: string): string {
  switch (condition) {
    case "sun": return "#f59e0b";
    case "rain": return "#3b82f6";
    case "thunder": return "#8b5cf6";
    case "fog": return "#6b7280";
    case "cloud":
    default: return "#94a3b8";
  }
}

function getConditionGlow(condition?: string): string {
  switch (condition) {
    case "sun": return "rgba(245,158,11,0.5)";
    case "rain": return "rgba(59,130,246,0.5)";
    case "thunder": return "rgba(139,92,246,0.5)";
    case "fog": return "rgba(107,114,128,0.4)";
    default: return "rgba(148,163,184,0.4)";
  }
}

// Compute visible GN divisions based on viewport bounds
function getViewportBounds(
  zoomLevel: number,
  panOffset: { x: number; y: number },
  svgWidth: number,
  svgHeight: number
) {
  // The SVG is scaled from center (50%, 50%), so we need to compute the visible region
  const scaledW = svgWidth / zoomLevel;
  const scaledH = svgHeight / zoomLevel;
  const centerX = svgWidth / 2 - panOffset.x / zoomLevel;
  const centerY = svgHeight / 2 - panOffset.y / zoomLevel;
  return {
    minX: centerX - scaledW / 2,
    maxX: centerX + scaledW / 2,
    minY: centerY - scaledH / 2,
    maxY: centerY + scaledH / 2,
  };
}

export const GNDivisionLayer = memo(function GNDivisionLayer({
  gnDivisions,
  weatherData,
  isLoading,
  zoomLevel,
  panOffset,
  svgWidth,
  svgHeight,
  cursorLatLng,
  proximityRadiusKm,
  selectedGNId,
  onSelectGN,
}: GNDivisionLayerProps) {
  const viewport = useMemo(
    () => getViewportBounds(zoomLevel, panOffset, svgWidth, svgHeight),
    [zoomLevel, panOffset, svgWidth, svgHeight]
  );

  // Show full label at zoom >= 4, mini dot at zoom 2-3
  const showFullLabel = zoomLevel >= 4;
  const showMiniDot = zoomLevel >= 2;

  // Compute which GN divisions are in viewport + near cursor
  const processedDivisions = useMemo(() => {
    return gnDivisions.map((gn) => {
      const { x, y } = latLngToSvg(gn.lat, gn.lng, svgWidth, svgHeight);
      const inViewport = x >= viewport.minX && x <= viewport.maxX && y >= viewport.minY && y <= viewport.maxY;

      const distFromCursor = cursorLatLng
        ? distanceKm(cursorLatLng.lat, cursorLatLng.lng, gn.lat, gn.lng)
        : Infinity;
      const isNear = distFromCursor <= proximityRadiusKm;
      const isVeryNear = distFromCursor <= proximityRadiusKm * 0.4;
      const weather = weatherData[gn.id];

      return { gn, x, y, inViewport, isNear, isVeryNear, weather, distFromCursor };
    }).filter((item) => item.inViewport);
  }, [gnDivisions, weatherData, viewport, cursorLatLng, proximityRadiusKm, svgWidth, svgHeight]);

  // Sort so near divisions render on top
  const sorted = useMemo(
    () => [...processedDivisions].sort((a, b) => (a.isNear ? 1 : 0) - (b.isNear ? 1 : 0)),
    [processedDivisions]
  );

  if (!showMiniDot) return null;

  return (
    <g id="gn-division-layer" role="group" aria-label="GN Division Weather Pins">
      <AnimatePresence>
        {sorted.map(({ gn, x, y, isNear, isVeryNear, weather }) => {
          const isSelected = selectedGNId === gn.id;
          const condition = weather?.condition;
          const temp = weather?.temp;
          const color = getConditionColor(condition);
          const glow = getConditionGlow(condition);
          const emoji = getConditionEmoji(condition);

          // Mini dot for zoom 2-3
          if (!showFullLabel) {
            return (
              <g
                key={gn.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectGN(gn)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={`${gn.name} weather pin`}
              >
                <motion.circle
                  r={isNear ? 5 : 3}
                  fill={color}
                  opacity={isNear ? 1 : 0.55}
                  stroke={isNear ? "white" : "transparent"}
                  strokeWidth={1}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: isNear ? 5 : 3, opacity: isNear ? 1 : 0.55 }}
                  transition={{ duration: 0.3 }}
                  style={isNear ? { filter: `drop-shadow(0 0 4px ${glow})` } : undefined}
                />
              </g>
            );
          }

          // Full label at zoom >= 4
          const labelWidth = isSelected || isNear ? 95 : 72;
          const labelHeight = isSelected || isNear ? 34 : 22;

          return (
            <motion.g
              key={gn.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onSelectGN(gn)}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: isLoading && !weather ? 0.45 : 1,
                scale: isSelected ? 1.18 : isVeryNear ? 1.1 : 1,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${gn.name}: ${weather?.description || "loading"}`}
            >
              {/* Proximity pulse ring */}
              {isNear && (
                <motion.circle
                  r={18}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                  animate={{ r: [14, 22], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* Background pill */}
              <rect
                x={-labelWidth / 2}
                y={isSelected || isNear ? -38 : -28}
                width={labelWidth}
                height={labelHeight}
                rx={isSelected || isNear ? 8 : 5}
                fill={isSelected ? color : isNear ? "#1e293b" : "#0f172a"}
                fillOpacity={isSelected ? 0.95 : 0.88}
                stroke={color}
                strokeWidth={isSelected ? 2 : isNear ? 1.5 : 0.8}
                strokeOpacity={isSelected ? 1 : 0.7}
                style={{ filter: isNear || isSelected ? `drop-shadow(0 0 6px ${glow})` : undefined }}
              />

              {/* Condition emoji */}
              <text
                x={-(labelWidth / 2) + 9}
                y={isSelected || isNear ? -22 : -15}
                fontSize={isSelected || isNear ? "10" : "8"}
                textAnchor="start"
                dominantBaseline="middle"
              >
                {isLoading && !weather ? "⏳" : emoji}
              </text>

              {/* Location name */}
              <text
                x={-(labelWidth / 2) + 20}
                y={isSelected || isNear ? -26 : -17}
                fontSize={isSelected || isNear ? "7.5" : "6"}
                fontWeight={isSelected || isNear ? "700" : "500"}
                fill={isSelected ? "white" : "#e2e8f0"}
                textAnchor="start"
                dominantBaseline="middle"
                fontFamily="system-ui, sans-serif"
              >
                {gn.name.length > 14 ? gn.name.slice(0, 13) + "…" : gn.name}
              </text>

              {/* Temperature */}
              {temp !== undefined && (
                <text
                  x={-(labelWidth / 2) + 20}
                  y={isSelected || isNear ? -14 : -7}
                  fontSize={isSelected || isNear ? "8" : "6.5"}
                  fontWeight="800"
                  fill={isSelected ? "white" : color}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  {temp}°C
                </text>
              )}

              {/* Pin stem */}
              <line
                x1="0"
                y1={isSelected || isNear ? -4 : -6}
                x2="0"
                y2="0"
                stroke={color}
                strokeWidth={isSelected ? 2 : 1.5}
                strokeOpacity={0.8}
              />

              {/* Pin dot */}
              <circle
                cx="0"
                cy="0"
                r={isSelected ? 4 : isNear ? 3.5 : 2.5}
                fill={color}
                stroke="white"
                strokeWidth={isSelected ? 1.5 : 1}
              />
            </motion.g>
          );
        })}
      </AnimatePresence>
    </g>
  );
});

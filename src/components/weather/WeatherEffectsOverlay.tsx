"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WeatherEffectType } from "@/lib/weatherApi";

interface WeatherEffectsOverlayProps {
  effect: WeatherEffectType;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function WeatherEffectsOverlay({
  effect,
  className = "",
  intensity = "medium",
}: WeatherEffectsOverlayProps) {
  const particleCount = intensity === "high" ? 35 : intensity === "medium" ? 20 : 10;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      delay: Math.random() * 3,
      duration: 0.8 + Math.random() * 1.5,
      size: 10 + Math.random() * 20,
    }));
  }, [particleCount]);

  if (effect === "rain") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10%", opacity: 0.8 }}
            animate={{ y: "110%", opacity: [0.8, 1, 0.2] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
            style={{ left: `${p.x}%`, width: "2px", height: `${p.size}px` }}
            className="absolute rounded-full bg-gradient-to-b from-blue-300/80 via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.6)]"
          />
        ))}
      </div>
    );
  }

  if (effect === "thunder") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* Lightning flash background */}
        <motion.div
          animate={{ opacity: [0, 0, 0.4, 0, 0.8, 0, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-blue-100/30 backdrop-brightness-150"
        />
        {/* Rain drops */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10%", opacity: 0.9 }}
            animate={{ y: "110%", opacity: [0.9, 1, 0.1] }}
            transition={{
              duration: p.duration * 0.7,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
            style={{ left: `${p.x}%`, width: "2.5px", height: `${p.size * 1.2}px` }}
            className="absolute rounded-full bg-gradient-to-b from-cyan-200 via-blue-500 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)]"
          />
        ))}
      </div>
    );
  }

  if (effect === "cloud") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: `${-30 + i * 25}%`, opacity: 0.3 }}
            animate={{ x: `${120}%`, opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 25 + i * 8,
              repeat: Infinity,
              delay: i * 4,
              ease: "easeInOut",
            }}
            style={{ top: `${15 + i * 20}%` }}
            className="absolute h-20 w-44 rounded-full bg-gradient-to-r from-gray-200/20 via-slate-300/40 to-gray-200/20 blur-xl dark:from-slate-700/30 dark:to-slate-800/30"
          />
        ))}
      </div>
    );
  }

  if (effect === "sun") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/40 via-amber-400/20 to-transparent blur-2xl"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-12 -right-12 h-56 w-56 rounded-full border border-amber-300/20"
        />
      </div>
    );
  }

  if (effect === "fog") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          animate={{ x: ["-10%", "10%", "-10%"], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-t from-emerald-100/30 via-slate-200/20 to-transparent blur-lg"
        />
      </div>
    );
  }

  return null;
}

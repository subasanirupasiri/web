"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WeatherDashboardView } from "@/components/weather/WeatherDashboardView";

export default function WeatherPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "weather" | "add" | "history" | "admin">("weather");

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <WeatherDashboardView />
    </AppShell>
  );
}

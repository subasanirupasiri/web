"use client";

import {
  LayoutDashboard,
  PlusCircle,
  History,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ViewTab } from "@/lib/types";

interface AppShellProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: ViewTab; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "add", label: "Add Prices", icon: PlusCircle },
    { id: "history", label: "History", icon: History },
  ];

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 bg-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-border/60 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text leading-tight">
              Lanka Market
            </h1>
            <p className="text-xs text-text-muted">Price Tracker</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                activeTab === id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/60 p-4">
          <p className="rounded-xl bg-accent/10 px-4 py-3 text-xs leading-relaxed text-accent-dark">
            Track daily vegetable prices across Sri Lankan economic centres.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text">Lanka Market</h1>
            <p className="text-xs text-text-muted">Price Tracker</p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-surface/95 backdrop-blur-md lg:hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
              activeTab === id ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                activeTab === id && "fill-primary/10"
              )}
            />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

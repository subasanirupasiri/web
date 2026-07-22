"use client";

import {
  LayoutDashboard,
  CloudSun,
  PlusCircle,
  History,
  Leaf,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ViewTab } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface AppShellProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: ViewTab; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "weather", label: "Weather Map", icon: CloudSun },
    { id: "add", label: "Add Prices", icon: PlusCircle },
    { id: "history", label: "History", icon: History },
    { id: "admin", label: "Admin", icon: Settings },
  ];

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 bg-surface/80 backdrop-blur-xl lg:flex">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 border-b border-border/60 px-6 py-5"
        >
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30"
          >
            <Leaf className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-text leading-tight flex items-center gap-2">
              Lanka Market
              <Sparkles className="h-4 w-4 text-primary" />
            </h1>
            <p className="text-xs text-text-muted">Price Tracker</p>
          </div>
        </motion.div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all relative overflow-hidden",
                activeTab === id
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {label}
              </span>
            </motion.button>
          ))}
        </nav>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-border/60 p-4"
        >
          <div className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 px-4 py-3 text-xs leading-relaxed text-accent-dark border border-accent/20">
            Track daily vegetable prices across Sri Lankan economic centres.
          </div>
        </motion.div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-surface/95 backdrop-blur-xl px-4 py-3 lg:hidden"
        >
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30"
          >
            <Leaf className="h-4 w-4 text-white" />
          </motion.div>
          <div>
            <h1 className="text-sm font-bold text-text flex items-center gap-2">
              Lanka Market
              <Sparkles className="h-3 w-3 text-primary" />
            </h1>
            <p className="text-xs text-text-muted">Price Tracker</p>
          </div>
        </motion.header>

        <main className="mx-auto max-w-6xl px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-surface/95 backdrop-blur-xl lg:hidden"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative",
              activeTab === id ? "text-primary" : "text-text-muted"
            )}
          >
            {activeTab === id && (
              <motion.div
                layoutId="activeMobileTab"
                className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                "h-5 w-5",
                activeTab === id && "fill-primary/20"
              )}
            />
            {label}
          </motion.button>
        ))}
      </motion.nav>
    </div>
  );
}

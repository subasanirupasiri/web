"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  delay?: number;
}

export function Card({ className, children, hover, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      className={cn(
        "rounded-2xl border border-border/60 bg-surface p-4 shadow-sm",
        hover && "transition-all duration-200 hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40":
            variant === "primary",
          "bg-gradient-to-r from-accent to-accent/90 text-white shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40":
            variant === "secondary",
          "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text":
            variant === "ghost",
          "bg-gradient-to-r from-danger to-danger/90 text-white shadow-lg shadow-danger/30 hover:shadow-xl hover:shadow-danger/40":
            variant === "danger",
          "border-2 border-border bg-surface text-text hover:border-primary/30 hover:bg-primary/5":
            variant === "outline",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-6 py-3.5 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

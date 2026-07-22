"use client";

import { cn } from "@/lib/cn";

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
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        {
          "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark":
            variant === "primary",
          "bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent-dark":
            variant === "secondary",
          "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text":
            variant === "ghost",
          "bg-danger text-white hover:bg-danger/90": variant === "danger",
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
    </button>
  );
}

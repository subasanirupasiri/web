import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-surface p-4 shadow-sm",
        hover && "transition-all duration-200 hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      {children}
    </div>
  );
}

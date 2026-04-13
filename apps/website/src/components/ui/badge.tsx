import { clsx } from "clsx";

type BadgeVariant = "success" | "destructive" | "neutral" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-success border-success/20",
  destructive: "bg-destructive/15 text-destructive border-destructive/20",
  neutral: "bg-surface-2 text-text-muted border-border",
  accent: "bg-accent/15 text-accent border-accent/20",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-1.5 py-0.5 border font-mono text-[10px] font-semibold uppercase tracking-[0.18em] leading-none",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

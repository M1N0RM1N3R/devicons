import { clsx } from "clsx";

interface TagProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function Tag({ children, onClick, active, className }: TagProps) {
  const Component = onClick ? "button" : "span";
  return (
    <Component
      onClick={onClick}
      className={clsx(
        "inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] leading-none border transition-colors duration-150",
        active
          ? "bg-accent/15 text-accent border-accent/30"
          : "bg-surface text-text-muted border-border hover:text-text hover:border-text-muted",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}

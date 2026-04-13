import { forwardRef } from "react";
import { clsx } from "clsx";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={ref}
          type="text"
          onChange={(e) => onValueChange?.(e.target.value)}
          className={clsx(
            "type-mono w-full pl-12 pr-4 py-3 bg-surface border border-border",
            "text-text placeholder:text-text-muted",
            "focus:outline-none focus:border-text-muted",
            "transition-colors duration-150",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

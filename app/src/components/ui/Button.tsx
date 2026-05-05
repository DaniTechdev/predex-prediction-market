import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "yes" | "no" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[rgb(153_69_255)] to-[rgb(123_49_219)] text-white shadow-[0_4px_20px_-4px_rgb(153_69_255_/_0.5)] hover:shadow-[0_6px_28px_-4px_rgb(153_69_255_/_0.7)] hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-background-overlay text-foreground border border-border-strong hover:bg-[rgb(var(--border-strong))]",
  ghost:
    "bg-transparent text-foreground-muted hover:text-foreground hover:bg-background-overlay",
  outline:
    "bg-transparent text-foreground border border-border-strong hover:border-foreground-faint hover:bg-background-overlay",
  yes:
    "bg-gradient-to-br from-[rgb(20_241_149)] to-[rgb(10_180_110)] text-[rgb(6_8_14)] shadow-[0_4px_20px_-4px_rgb(20_241_149_/_0.5)] hover:shadow-[0_6px_28px_-4px_rgb(20_241_149_/_0.7)] hover:-translate-y-px",
  no:
    "bg-gradient-to-br from-[rgb(248_113_113)] to-[rgb(220_60_60)] text-white shadow-[0_4px_20px_-4px_rgb(248_113_113_/_0.5)] hover:shadow-[0_6px_28px_-4px_rgb(248_113_113_/_0.7)] hover:-translate-y-px",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
    />
  </svg>
);

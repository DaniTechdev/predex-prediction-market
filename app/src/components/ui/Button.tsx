"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "yes" | "no" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[rgb(153_69_255)] to-[rgb(123_49_219)] text-white shadow-[0_4px_24px_-4px_rgb(153_69_255_/_0.55)] hover:shadow-[0_8px_36px_-4px_rgb(153_69_255_/_0.75)]",
  secondary:
    "bg-background-overlay text-foreground border border-border-strong hover:bg-[rgb(var(--border-strong))]",
  ghost:
    "bg-transparent text-foreground-muted hover:text-foreground hover:bg-background-overlay",
  outline:
    "bg-transparent text-foreground border border-border-strong hover:border-foreground-faint hover:bg-background-overlay",
  yes:
    "bg-gradient-to-br from-[rgb(20_241_149)] to-[rgb(10_180_110)] text-[rgb(6_8_14)] shadow-[0_4px_24px_-4px_rgb(20_241_149_/_0.55)] hover:shadow-[0_8px_36px_-4px_rgb(20_241_149_/_0.75)]",
  no:
    "bg-gradient-to-br from-[rgb(248_113_113)] to-[rgb(220_60_60)] text-white shadow-[0_4px_24px_-4px_rgb(248_113_113_/_0.55)] hover:shadow-[0_8px_36px_-4px_rgb(248_113_113_/_0.75)]",
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
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[background,border-color,box-shadow,opacity,color] duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...(rest as HTMLMotionProps<"button">)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </motion.button>
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

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "yes" | "no" | "warning" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneStyles: Record<Tone, string> = {
  neutral:
    "bg-background-overlay border-border-strong text-foreground-muted",
  yes:
    "bg-[rgb(20_241_149_/_0.12)] border-[rgb(20_241_149_/_0.3)] text-[rgb(20_241_149)]",
  no:
    "bg-[rgb(248_113_113_/_0.12)] border-[rgb(248_113_113_/_0.3)] text-[rgb(248_113_113)]",
  warning:
    "bg-[rgb(250_204_21_/_0.12)] border-[rgb(250_204_21_/_0.3)] text-[rgb(250_204_21)]",
  accent:
    "bg-[rgb(153_69_255_/_0.12)] border-[rgb(153_69_255_/_0.3)] text-[rgb(173_99_255)]",
};

export const Badge = ({ tone = "neutral", className, ...rest }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      toneStyles[tone],
      className,
    )}
    {...rest}
  />
);

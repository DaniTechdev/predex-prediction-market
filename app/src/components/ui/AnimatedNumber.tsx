"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useMotionValue, useTransform } from "motion/react";
import { motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
  compact = false,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const formatted = useTransform(motionValue, (latest) => {
    if (compact && Math.abs(latest) >= 1_000) {
      return `${prefix}${new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: decimals,
      }).format(latest)}${suffix}`;
    }
    return `${prefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(latest)}${suffix}`;
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, value, duration, motionValue]);

  return <motion.span ref={ref} className={className}>{formatted}</motion.span>;
}

"use client";

import { motion } from "motion/react";
import { TrendingUp, Users, Zap } from "lucide-react";
import { useMarkets } from "@/hooks/useMarkets";
import { fromUsdcRaw } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function LiveStats() {
  const { data } = useMarkets();
  const markets = data ?? [];
  const totalVolume = markets.reduce((acc, m) => acc + fromUsdcRaw(m.market.totalVolume), 0);
  const totalLiquidity = markets.reduce((acc, m) => acc + fromUsdcRaw(m.pool.liquidityUsdc), 0);
  const activeMarkets = markets.filter((m) => !m.market.resolved).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-3 gap-3 sm:gap-4 mt-12 max-w-2xl w-full"
    >
      <Stat
        icon={<Zap className="size-4" />}
        label="Active markets"
        value={activeMarkets}
        prefix=""
      />
      <Stat
        icon={<Users className="size-4" />}
        label="Liquidity"
        value={totalLiquidity}
        prefix="$"
        compact
      />
      <Stat
        icon={<TrendingUp className="size-4" />}
        label="Volume traded"
        value={totalVolume}
        prefix="$"
        compact
      />
    </motion.div>
  );
}

function Stat({
  icon,
  label,
  value,
  prefix = "",
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background-elevated/40 backdrop-blur-sm px-4 py-3 sm:py-4 text-left">
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted mb-1.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight">
        <AnimatedNumber value={value} prefix={prefix} compact={compact} />
      </div>
    </div>
  );
}

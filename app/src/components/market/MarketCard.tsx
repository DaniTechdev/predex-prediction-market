"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  formatProbability,
  formatRelativeTime,
  formatUsdc,
  fromPriceScaled,
  fromUsdcRaw,
} from "@/lib/format";
import type { MarketView } from "@/hooks/useMarkets";

export function MarketCard({ view }: { view: MarketView }) {
  const { publicKey, market, pool, ai } = view;
  const yesPrice = fromPriceScaled(pool.lastPriceYes);
  const aiProb = ai.currentProbability;
  const volume = fromUsdcRaw(market.totalVolume);
  const liquidity = fromUsdcRaw(pool.liquidityUsdc);
  const endTime = Number(market.endTime);
  const isExpired = endTime < Math.floor(Date.now() / 1000);
  const isResolved = market.resolved;

  const status = isResolved
    ? { label: "Resolved", tone: "neutral" as const }
    : isExpired
      ? { label: "Awaiting resolution", tone: "warning" as const }
      : { label: "Active", tone: "yes" as const };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Link href={`/market/${publicKey.toBase58()}`} className="group block h-full">
        <Card className="h-full transition-all duration-300 hover:border-accent/50 hover:shadow-[0_18px_48px_-16px_rgb(153_69_255_/_0.45)] relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgb(153 69 255 / 0.12), transparent 60%)",
            }}
          />
          <div className="p-5 sm:p-6 flex flex-col h-full gap-4 relative">
            <div className="flex items-start justify-between gap-3">
              <Badge tone={status.tone}>
                {status.tone === "yes" ? (
                  <span className="relative inline-flex size-1.5 rounded-full bg-success">
                    <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                  </span>
                ) : null}
                {status.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-foreground-faint">
                <Clock className="size-3" />
                <span>{formatRelativeTime(endTime)}</span>
              </div>
            </div>

            <h3 className="font-semibold text-base sm:text-lg leading-snug text-foreground line-clamp-3 group-hover:text-foreground">
              {market.question}
            </h3>

            <div className="mt-auto flex flex-col gap-3">
              <PriceBar yesPrice={yesPrice} />

              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1 text-foreground-muted">
                  <Sparkles className="size-3.5 text-accent" />
                  <span>AI: {formatProbability(aiProb)}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground-muted">
                  <span>Liq ${formatUsdc(liquidity, { compact: true })}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:flex items-center gap-1">
                    <TrendingUp className="size-3.5" /> ${formatUsdc(volume, { compact: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function PriceBar({ yesPrice }: { yesPrice: number }) {
  const yesPct = Math.max(0.02, Math.min(0.98, yesPrice));
  const noPct = 1 - yesPct;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
        <span className="text-yes">YES {formatProbability(yesPct * 100)}</span>
        <span className="text-no">NO {formatProbability(noPct * 100)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background-overlay overflow-hidden flex">
        <motion.div
          className="h-full bg-yes"
          initial={{ width: 0 }}
          animate={{ width: `${yesPct * 100}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="h-full bg-no"
          initial={{ width: 0 }}
          animate={{ width: `${noPct * 100}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

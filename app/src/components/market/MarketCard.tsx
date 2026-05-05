import Link from "next/link";
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
    <Link href={`/market/${publicKey.toBase58()}`} className="group block">
      <Card className="h-full transition-all duration-200 hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-12px_rgb(153_69_255_/_0.4)]">
        <div className="p-5 sm:p-6 flex flex-col h-full gap-4">
          <div className="flex items-start justify-between gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
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
                <span>Liquidity ${formatUsdc(liquidity, { compact: true })}</span>
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
        <div
          className="h-full bg-yes transition-all"
          style={{ width: `${yesPct * 100}%` }}
        />
        <div className="h-full bg-no transition-all" style={{ width: `${noPct * 100}%` }} />
      </div>
    </div>
  );
}

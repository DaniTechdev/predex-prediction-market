"use client";

import Link from "next/link";
import {
  Clock,
  ExternalLink,
  Sparkles,
  Brain,
  ArrowLeft,
  Users,
  TrendingUp,
} from "lucide-react";
import { useMarket } from "@/hooks/useMarkets";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TradingPanel } from "./TradingPanel";
import { PositionPanel } from "./PositionPanel";
import { CreatorPanel } from "./CreatorPanel";
import {
  formatDate,
  formatProbability,
  formatRelativeTime,
  formatUsdc,
  fromPriceScaled,
  fromUsdcRaw,
  shortAddr,
} from "@/lib/format";
import { explorerUrl } from "@/lib/config";

export function MarketDetail({ marketAddress }: { marketAddress: string }) {
  const { data, isLoading, error, refetch } = useMarket(marketAddress);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="h-[400px] skeleton rounded-[var(--radius-card)]" />
          <div className="h-[400px] skeleton rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Market not found</h1>
        <p className="text-foreground-muted mt-2">
          {error ? (error as Error).message : "We couldn't load this market."}
        </p>
        <Link href="/" className="inline-block mt-6">
          <Button variant="secondary">
            <ArrowLeft className="size-4" /> Back to markets
          </Button>
        </Link>
      </div>
    );
  }

  const { market, pool, ai, publicKey } = data;
  const yesPrice = fromPriceScaled(pool.lastPriceYes);
  const noPrice = fromPriceScaled(pool.lastPriceNo);
  const liquidity = fromUsdcRaw(pool.liquidityUsdc);
  const volume = fromUsdcRaw(market.totalVolume);
  const endTs = Number(market.endTime);
  const isExpired = endTs < Math.floor(Date.now() / 1000);
  const isResolved = market.resolved;

  const status: { label: string; tone: "yes" | "no" | "warning" } = isResolved
    ? {
        label: market.winningOutcome === 0 ? "Resolved · YES" : "Resolved · NO",
        tone: market.winningOutcome === 0 ? "yes" : "no",
      }
    : isExpired
      ? { label: "Awaiting resolution", tone: "warning" }
      : { label: "Active", tone: "yes" };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> All markets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-foreground-faint">
                <Clock className="size-3" /> {isExpired ? "Ended" : "Ends"} {formatRelativeTime(endTs)}
              </span>
              <a
                href={explorerUrl(publicKey.toBase58())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-foreground-faint hover:text-foreground"
              >
                {shortAddr(publicKey.toBase58())} <ExternalLink className="size-3" />
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {market.question}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="YES" value={formatProbability(yesPrice * 100)} tone="yes" />
            <Stat label="NO" value={formatProbability(noPrice * 100)} tone="no" />
            <Stat
              label="Liquidity"
              value={`$${formatUsdc(liquidity, { compact: true })}`}
              icon={<Users className="size-3.5" />}
            />
            <Stat
              label="Volume"
              value={`$${formatUsdc(volume, { compact: true })}`}
              icon={<TrendingUp className="size-3.5" />}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Brain className="size-4 text-accent" /> AI signal
                </h2>
                <Badge tone="accent">{ai.confidenceScore}% confidence</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Metric label="Probability" value={formatProbability(ai.currentProbability)} />
                <Metric label="Sentiment" value={`${ai.sentiment > 0 ? "+" : ""}${ai.sentiment}`} />
                <Metric
                  label="Recommendation"
                  value={
                    ai.aiRecommendation === 0
                      ? "Buy YES"
                      : ai.aiRecommendation === 1
                        ? "Buy NO"
                        : "Hold"
                  }
                />
                <Metric label="Initial probability" value={formatProbability(ai.initialProbability)} />
                <Metric label="Last updated" value={formatDate(Number(ai.lastUpdated))} />
              </div>
              <p className="text-xs text-foreground-faint mt-4 inline-flex items-center gap-1.5">
                <Sparkles className="size-3" /> Updated by the market creator acting as an off-chain oracle.
              </p>
            </CardBody>
          </Card>

          <PositionPanel marketAddress={publicKey.toBase58()} marketView={data} onResolved={refetch} />

          <CreatorPanel marketView={data} onMutate={refetch} />

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Details</h2>
            </CardHeader>
            <CardBody className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Created" value={formatDate(Number(market.createdAt))} />
              <Detail label="Ends" value={formatDate(endTs)} />
              <Detail label="Creator">
                <a
                  href={explorerUrl(market.creator.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent inline-flex items-center gap-1"
                >
                  {shortAddr(market.creator.toBase58())} <ExternalLink className="size-3" />
                </a>
              </Detail>
              <Detail label="Market ID" value={market.id.toString()} />
            </CardBody>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20">
          <TradingPanel marketView={data} onTraded={refetch} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "yes" | "no";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background-elevated/50 p-4">
      <div className="text-xs text-foreground-muted flex items-center gap-1">
        {icon} {label}
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold mt-1 ${
          tone === "yes" ? "text-yes" : tone === "no" ? "text-no" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-foreground-muted">{label}</div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-2 last:border-b-0">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-right font-medium">{children ?? value}</span>
    </div>
  );
}

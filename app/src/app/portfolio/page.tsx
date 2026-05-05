"use client";

import Link from "next/link";
import { Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMarkets } from "@/hooks/useMarkets";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useMyPositions, type MyPositionRow } from "@/hooks/useMyPositions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConnectGate } from "@/components/layout/ConnectGate";
import { Badge } from "@/components/ui/Badge";
import {
  formatProbability,
  formatUsdc,
  fromPriceScaled,
  fromShareRaw,
  fromUsdcRaw,
  shortAddr,
} from "@/lib/format";
import { explorerUrl } from "@/lib/config";

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-foreground-faint mb-2">Your portfolio</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Positions</h1>
        <p className="text-foreground-muted mt-2">
          Active and resolved markets where you hold YES or NO shares.
        </p>
      </div>

      <ConnectGate>
        <PortfolioContent />
      </ConnectGate>
    </div>
  );
}

function PortfolioContent() {
  const { publicKey } = useWallet();
  const { data: balance } = useUsdcBalance();
  const { data: markets, isLoading } = useMarkets();
  const positions = useMyPositions(markets);

  if (!publicKey) return null;

  const myPositions = positions.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="USDC balance" value={`$${formatUsdc(balance?.ui ?? 0)}`} icon={<Wallet className="size-4" />} />
        <SummaryCard label="Active positions" value={myPositions.filter((p) => !p.market.resolved).length.toString()} />
        <SummaryCard
          label="Wallet"
          value={shortAddr(publicKey.toBase58())}
          link={explorerUrl(publicKey.toBase58())}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Holdings</h2>
        </CardHeader>
        <CardBody>
          {isLoading || positions.isLoading ? (
            <div className="h-32 skeleton rounded-md" />
          ) : myPositions.length === 0 ? (
            <div className="py-8 text-center text-foreground-muted">
              <p>No positions yet.</p>
              <Link href="/" className="text-accent hover:underline text-sm mt-2 inline-block">
                Browse markets
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {myPositions.map((p) => (
                <PositionRow key={p.publicKey.toBase58()} item={p} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  link,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  link?: string;
}) {
  const Wrapper = link ? "a" : "div";
  return (
    <Wrapper
      {...(link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="rounded-[var(--radius-card)] border border-border bg-background-elevated/50 p-5 block"
    >
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
        {icon} {label}
        {link ? <ExternalLink className="size-3 ml-auto" /> : null}
      </div>
      <div className="text-2xl font-bold mt-1.5 font-mono">{value}</div>
    </Wrapper>
  );
}

function PositionRow({ item }: { item: MyPositionRow }) {
  const yes = fromShareRaw(item.position.yesAmount);
  const no = fromShareRaw(item.position.noAmount);
  const yesPrice = fromPriceScaled(item.pool.lastPriceYes);
  const noPrice = fromPriceScaled(item.pool.lastPriceNo);
  const valueYes = yes * yesPrice;
  const valueNo = no * noPrice;
  const totalSpent = fromUsdcRaw(item.position.totalSpentYes) + fromUsdcRaw(item.position.totalSpentNo);
  const totalValue = valueYes + valueNo;
  const pnl = totalValue - totalSpent;
  const pnlPct = totalSpent > 0 ? (pnl / totalSpent) * 100 : 0;

  return (
    <Link
      href={`/market/${item.publicKey.toBase58()}`}
      className="py-4 flex items-center gap-4 group hover:bg-background-overlay/30 -mx-5 sm:-mx-6 px-5 sm:px-6 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {item.market.resolved ? (
            <Badge tone={item.market.winningOutcome === 0 ? "yes" : "no"}>
              Resolved · {item.market.winningOutcome === 0 ? "YES" : "NO"}
            </Badge>
          ) : (
            <Badge tone="yes">Active</Badge>
          )}
        </div>
        <p className="font-medium truncate group-hover:text-accent transition-colors">{item.market.question}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-muted mt-1.5">
          {yes > 0 ? <span><span className="text-yes">{yes.toFixed(2)} YES</span> @ {formatProbability(yesPrice * 100)}</span> : null}
          {no > 0 ? <span><span className="text-no">{no.toFixed(2)} NO</span> @ {formatProbability(noPrice * 100)}</span> : null}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono font-semibold">${formatUsdc(totalValue)}</div>
        <div className={`text-xs ${pnl >= 0 ? "text-success" : "text-danger"}`}>
          {pnl >= 0 ? "+" : ""}${formatUsdc(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trophy, ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useProgram } from "@/hooks/useProgram";
import { usePosition } from "@/hooks/usePosition";
import { claimWinnings } from "@/lib/tx";
import {
  formatProbability,
  formatUsdc,
  fromShareRaw,
  fromUsdcRaw,
} from "@/lib/format";
import type { MarketView } from "@/hooks/useMarkets";

export function PositionPanel({
  marketAddress,
  marketView,
  onResolved,
}: {
  marketAddress: string;
  marketView: MarketView;
  onResolved: () => void;
}) {
  const { data: position } = usePosition(marketAddress);
  const { program, wallet } = useProgram();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  if (!wallet || !position) return null;

  const yes = fromShareRaw(position.yesAmount);
  const no = fromShareRaw(position.noAmount);
  if (yes === 0 && no === 0) return null;

  const spentYes = fromUsdcRaw(position.totalSpentYes);
  const spentNo = fromUsdcRaw(position.totalSpentNo);
  const avgYes = yes > 0 ? spentYes / yes : 0;
  const avgNo = no > 0 ? spentNo / no : 0;

  const isResolved = marketView.market.resolved;
  const winningOutcome = marketView.market.winningOutcome;
  const userWinningShares = winningOutcome === 0 ? yes : winningOutcome === 1 ? no : 0;
  const totalWinningShares =
    winningOutcome === 0
      ? fromShareRaw(marketView.pool.yesShares)
      : winningOutcome === 1
        ? fromShareRaw(marketView.pool.noShares)
        : 0;
  const liquidity = fromUsdcRaw(marketView.pool.liquidityUsdc);
  const estPayout =
    isResolved && userWinningShares > 0 && totalWinningShares > 0
      ? (userWinningShares / totalWinningShares) * liquidity
      : 0;

  const canClaim = isResolved && !position.claimed && estPayout > 0;
  const wasLoser = isResolved && userWinningShares === 0;

  const handleClaim = async () => {
    if (!wallet || claiming) return;
    setClaiming(true);
    try {
      await toast.promise(
        claimWinnings(program, wallet.publicKey, marketView.publicKey),
        {
          loading: "Claiming…",
          success: `Claimed ~$${formatUsdc(estPayout)}`,
          error: (err: Error) => err.message,
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["position"] }),
        queryClient.invalidateQueries({ queryKey: ["market", marketView.publicKey.toBase58()] }),
        queryClient.invalidateQueries({ queryKey: ["usdc-balance"] }),
      ]);
      onResolved();
    } catch {
      // toast already shown
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your position</h2>
          {isResolved ? (
            position.claimed ? (
              <Badge tone="neutral">Claimed</Badge>
            ) : canClaim ? (
              <Badge tone="yes">
                <Trophy className="size-3" /> Winner
              </Badge>
            ) : wasLoser ? (
              <Badge tone="neutral">Settled</Badge>
            ) : null
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {yes > 0 ? (
            <SideStat
              label="YES shares"
              shares={yes}
              spent={spentYes}
              avg={avgYes}
              tone="yes"
              isWinner={isResolved && winningOutcome === 0}
            />
          ) : null}
          {no > 0 ? (
            <SideStat
              label="NO shares"
              shares={no}
              spent={spentNo}
              avg={avgNo}
              tone="no"
              isWinner={isResolved && winningOutcome === 1}
            />
          ) : null}
        </div>

        {canClaim ? (
          <div className="rounded-[10px] border border-yes/30 bg-yes/5 p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-yes">Estimated payout</div>
              <div className="text-2xl font-bold mt-0.5">${formatUsdc(estPayout)}</div>
            </div>
            <Button variant="yes" onClick={handleClaim} loading={claiming}>
              Claim
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function SideStat({
  label,
  shares,
  spent,
  avg,
  tone,
  isWinner,
}: {
  label: string;
  shares: number;
  spent: number;
  avg: number;
  tone: "yes" | "no";
  isWinner?: boolean;
}) {
  return (
    <div className={`rounded-[10px] border p-4 ${tone === "yes" ? "border-yes/20 bg-yes/5" : "border-no/20 bg-no/5"}`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium ${tone === "yes" ? "text-yes" : "text-no"}`}>
          {label}
        </div>
        {isWinner ? <Trophy className="size-4 text-yes" /> : null}
      </div>
      <div className="text-xl font-bold mt-1">{shares.toFixed(4)}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-foreground-muted">
        <div>
          <div className="flex items-center gap-1">
            <ArrowUp className="size-3" /> Spent
          </div>
          <div className="text-foreground font-medium mt-0.5">${formatUsdc(spent)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <ArrowDown className="size-3" /> Avg
          </div>
          <div className="text-foreground font-medium mt-0.5">{formatProbability(avg * 100)}</div>
        </div>
      </div>
    </div>
  );
}

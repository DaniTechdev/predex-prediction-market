"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BN } from "@coral-xyz/anchor";
import toast from "react-hot-toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ConnectGate } from "@/components/layout/ConnectGate";
import { useProgram } from "@/hooks/useProgram";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { buyShares, sellShares } from "@/lib/tx";
import {
  formatProbability,
  formatUsdc,
  fromPriceScaled,
  fromShareRaw,
  toUsdcRaw,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MarketView } from "@/hooks/useMarkets";
import { usePosition } from "@/hooks/usePosition";

type Tab = "buy" | "sell";

export function TradingPanel({
  marketView,
  onTraded,
}: {
  marketView: MarketView;
  onTraded: () => void;
}) {
  const isResolved = marketView.market.resolved;
  const isExpired =
    Number(marketView.market.endTime) < Math.floor(Date.now() / 1000);

  if (isResolved || isExpired) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Trading closed</h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-foreground-muted">
            {isResolved
              ? "This market has been resolved. Holders of winning shares can claim their payout below."
              : "This market has reached its deadline and is awaiting resolution. Trading is paused."}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Trade</h2>
      </CardHeader>
      <CardBody>
        <ConnectGate>
          <TradeForm marketView={marketView} onTraded={onTraded} />
        </ConnectGate>
      </CardBody>
    </Card>
  );
}

function TradeForm({
  marketView,
  onTraded,
}: {
  marketView: MarketView;
  onTraded: () => void;
}) {
  const { program, wallet } = useProgram();
  const queryClient = useQueryClient();
  const { data: balance } = useUsdcBalance();
  const { data: position } = usePosition(marketView.publicKey);

  const [tab, setTab] = useState<Tab>("buy");
  const [outcome, setOutcome] = useState<0 | 1>(0);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const yesPrice = fromPriceScaled(marketView.pool.lastPriceYes);
  const noPrice = fromPriceScaled(marketView.pool.lastPriceNo);
  const price = outcome === 0 ? yesPrice : noPrice;

  const userYes = position ? fromShareRaw(position.yesAmount) : 0;
  const userNo = position ? fromShareRaw(position.noAmount) : 0;
  const userOutcomeShares = outcome === 0 ? userYes : userNo;

  const numAmount = Number(amount);
  const amountValid = numAmount > 0 && Number.isFinite(numAmount);

  const estShares = tab === "buy" && amountValid && price > 0 ? numAmount / price : 0;
  const estPayout = tab === "sell" && amountValid && price > 0 ? numAmount * price : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !amountValid || submitting) return;

    setSubmitting(true);
    const promise =
      tab === "buy"
        ? buyShares(program, wallet.publicKey, marketView.publicKey, outcome, toUsdcRaw(numAmount))
        : sellShares(
            program,
            wallet.publicKey,
            marketView.publicKey,
            outcome,
            new BN(Math.floor(numAmount * 1_000_000)),
          );

    try {
      await toast.promise(promise, {
        loading: tab === "buy" ? "Buying shares…" : "Selling shares…",
        success: tab === "buy" ? "Shares purchased" : "Shares sold",
        error: (err: Error) => parseAnchorError(err),
      });
      setAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["market", marketView.publicKey.toBase58()] }),
        queryClient.invalidateQueries({ queryKey: ["position"] }),
        queryClient.invalidateQueries({ queryKey: ["usdc-balance"] }),
      ]);
      onTraded();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Tabs value={tab} onChange={setTab} hasPosition={Boolean(position && (userYes > 0 || userNo > 0))} />

      <div className="grid grid-cols-2 gap-2">
        <OutcomeButton
          active={outcome === 0}
          onClick={() => setOutcome(0)}
          label="YES"
          price={yesPrice}
          tone="yes"
        />
        <OutcomeButton
          active={outcome === 1}
          onClick={() => setOutcome(1)}
          label="NO"
          price={noPrice}
          tone="no"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="!mb-0">{tab === "buy" ? "Amount (USDC)" : "Amount (shares)"}</Label>
          {tab === "buy" && balance ? (
            <button
              type="button"
              onClick={() => setAmount(balance.ui.toFixed(2))}
              className="text-xs text-accent hover:underline"
            >
              Max: {formatUsdc(balance.ui)}
            </button>
          ) : tab === "sell" && userOutcomeShares > 0 ? (
            <button
              type="button"
              onClick={() => setAmount(userOutcomeShares.toFixed(6))}
              className="text-xs text-accent hover:underline"
            >
              Max: {userOutcomeShares.toFixed(2)}
            </button>
          ) : null}
        </div>
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0.00"
          suffix={tab === "buy" ? "USDC" : "shares"}
        />
      </div>

      <div className="rounded-[10px] border border-border bg-background-overlay p-3 text-sm">
        {tab === "buy" ? (
          <Row label={`Est. ${outcome === 0 ? "YES" : "NO"} shares`} value={estShares.toFixed(4)} />
        ) : (
          <Row label="Est. USDC received" value={`$${estPayout.toFixed(4)}`} />
        )}
        <Row label="Price per share" value={formatProbability(price * 100)} />
        {position ? (
          <Row
            label="Your shares"
            value={`${userYes.toFixed(2)} YES · ${userNo.toFixed(2)} NO`}
          />
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        variant={outcome === 0 ? "yes" : "no"}
        disabled={!amountValid}
        loading={submitting}
      >
        {tab === "buy" ? "Buy" : "Sell"} {outcome === 0 ? "YES" : "NO"}
      </Button>
    </form>
  );
}

function Tabs({
  value,
  onChange,
  hasPosition,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
  hasPosition: boolean;
}) {
  return (
    <div className="grid grid-cols-2 p-1 rounded-[10px] bg-background-overlay border border-border">
      {(["buy", "sell"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          disabled={t === "sell" && !hasPosition}
          className={cn(
            "h-9 rounded-md text-sm font-medium transition-colors capitalize",
            value === t ? "bg-background text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground",
            t === "sell" && !hasPosition && "opacity-50 cursor-not-allowed",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function OutcomeButton({
  active,
  onClick,
  label,
  price,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  price: number;
  tone: "yes" | "no";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[10px] border p-3 text-left transition-all",
        active && tone === "yes" && "border-yes bg-yes/10",
        active && tone === "no" && "border-no bg-no/10",
        !active && "border-border-strong bg-background-overlay hover:border-foreground-faint",
      )}
    >
      <div className={cn("text-xs font-medium", tone === "yes" ? "text-yes" : "text-no")}>{label}</div>
      <div className="text-lg font-bold mt-0.5">{formatProbability(price * 100)}</div>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 first:pt-0 last:pb-0">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function parseAnchorError(err: Error): string {
  const msg = err?.message ?? String(err);
  const match = msg.match(/Error: ([A-Za-z]+)/);
  if (match?.[1]) return match[1];
  return msg.length > 80 ? `${msg.slice(0, 80)}…` : msg;
}

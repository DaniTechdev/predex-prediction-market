"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { Settings, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useProgram } from "@/hooks/useProgram";
import { resolveMarket, updateAiConfidence } from "@/lib/tx";
import { formatRelativeTime } from "@/lib/format";
import { parseTxError } from "@/lib/errors";
import type { MarketView } from "@/hooks/useMarkets";

export function CreatorPanel({
  marketView,
  onMutate,
}: {
  marketView: MarketView;
  onMutate: () => void;
}) {
  const { publicKey } = useWallet();
  const isCreator = publicKey?.equals(marketView.market.creator) ?? false;
  if (!isCreator) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="size-4 text-accent" /> Creator controls
        </h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <ResolveSection marketView={marketView} onMutate={onMutate} />
        <div className="border-t border-border" />
        <AiSection marketView={marketView} onMutate={onMutate} />
      </CardBody>
    </Card>
  );
}

function ResolveSection({
  marketView,
  onMutate,
}: {
  marketView: MarketView;
  onMutate: () => void;
}) {
  const { program, wallet } = useProgram();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<0 | 1 | null>(null);

  const endTs = Number(marketView.market.endTime);
  const isResolved = marketView.market.resolved;
  const isExpired = endTs < Math.floor(Date.now() / 1000);

  const handleResolve = async (winning: 0 | 1) => {
    if (!wallet || submitting !== null) return;
    setSubmitting(winning);
    try {
      await toast.promise(
        resolveMarket(program, wallet.publicKey, marketView.publicKey, winning),
        {
          loading: "Resolving…",
          success: `Resolved as ${winning === 0 ? "YES" : "NO"}`,
          error: (err: Error) => parseTxError(err),
        },
      );
      await queryClient.invalidateQueries({ queryKey: ["market"] });
      onMutate();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(null);
    }
  };

  if (isResolved) {
    return (
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-5 text-success mt-0.5" />
        <div>
          <p className="font-medium">Market resolved</p>
          <p className="text-sm text-foreground-muted">
            Winning outcome: <span className={marketView.market.winningOutcome === 0 ? "text-yes" : "text-no"}>
              {marketView.market.winningOutcome === 0 ? "YES" : "NO"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (!isExpired) {
    return (
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 text-warning mt-0.5" />
        <div>
          <p className="font-medium">Resolution available {formatRelativeTime(endTs)}</p>
          <p className="text-sm text-foreground-muted">
            You can resolve this market once the deadline passes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-medium">Resolve market</p>
      <p className="text-sm text-foreground-muted mt-1">
        Pick the winning outcome. This is final and irreversible.
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button variant="yes" onClick={() => handleResolve(0)} loading={submitting === 0} disabled={submitting !== null}>
          Resolve YES
        </Button>
        <Button variant="no" onClick={() => handleResolve(1)} loading={submitting === 1} disabled={submitting !== null}>
          Resolve NO
        </Button>
      </div>
    </div>
  );
}

function AiSection({
  marketView,
  onMutate,
}: {
  marketView: MarketView;
  onMutate: () => void;
}) {
  const { program, wallet } = useProgram();
  const queryClient = useQueryClient();
  const [confidence, setConfidence] = useState(marketView.ai.confidenceScore);
  const [probability, setProbability] = useState(marketView.ai.currentProbability);
  const [sentiment, setSentiment] = useState(marketView.ai.sentiment);
  const [recommendation, setRecommendation] = useState<0 | 1 | 2>(
    marketView.ai.aiRecommendation as 0 | 1 | 2,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || submitting) return;
    setSubmitting(true);
    try {
      await toast.promise(
        updateAiConfidence(program, wallet.publicKey, marketView.publicKey, {
          confidenceScore: confidence,
          newProbability: probability,
          sentiment,
          aiRecommendation: recommendation,
        }),
        {
          loading: "Updating AI signal…",
          success: "AI signal updated",
          error: (err: Error) => parseTxError(err),
        },
      );
      await queryClient.invalidateQueries({ queryKey: ["market"] });
      onMutate();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="font-medium">Update AI signal</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Probability ({probability}%)</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={probability}
            onChange={(e) => setProbability(Number(e.target.value))}
            className="w-full accent-[rgb(153_69_255)]"
          />
        </div>
        <div>
          <Label>Confidence ({confidence}%)</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-[rgb(153_69_255)]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sentiment (-100..100)</Label>
          <Input
            type="number"
            min={-100}
            max={100}
            value={sentiment}
            onChange={(e) => setSentiment(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))}
          />
        </div>
        <div>
          <Label>Recommendation</Label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(Number(e.target.value) as 0 | 1 | 2)}
            className="w-full h-11 rounded-[10px] border border-border-strong bg-background-overlay px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value={0}>Buy YES</option>
            <option value={1}>Buy NO</option>
            <option value={2}>Hold</option>
          </select>
        </div>
      </div>
      <Button type="submit" variant="secondary" loading={submitting} className="self-start">
        Update AI signal
      </Button>
    </form>
  );
}

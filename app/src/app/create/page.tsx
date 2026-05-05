"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ConnectGate } from "@/components/layout/ConnectGate";
import { useProgram } from "@/hooks/useProgram";
import { createMarket, newMarketId } from "@/lib/tx";
import { marketPda } from "@/lib/pdas";

export default function CreateMarketPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-foreground-faint mb-2">New market</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pose a question</h1>
        <p className="text-foreground-muted mt-2">
          Give traders a clear YES/NO outcome and a deadline. The pool seeds with virtual liquidity so trading starts immediately.
        </p>
      </div>
      <ConnectGate>
        <CreateMarketForm />
      </ConnectGate>
    </div>
  );
}

function CreateMarketForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { program, wallet } = useProgram();

  const [question, setQuestion] = useState("");
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [initialProb, setInitialProb] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const endTs = Math.floor(new Date(endTime).getTime() / 1000);
  const valid =
    question.trim().length > 0 &&
    question.length <= 200 &&
    endTs > Math.floor(Date.now() / 1000) &&
    initialProb >= 0 &&
    initialProb <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !valid || submitting) return;

    setSubmitting(true);
    const marketId = newMarketId();
    const market = marketPda(wallet.publicKey, marketId);

    const promise = createMarket(program, wallet.publicKey, {
      marketId,
      question: question.trim(),
      endTime: new BN(endTs),
      initialProbability: initialProb,
    });

    try {
      await toast.promise(promise, {
        loading: "Creating market…",
        success: "Market created",
        error: (err: Error) => `Failed: ${err.message}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["markets"] });
      router.push(`/market/${market.toBase58()}`);
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Market details</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              required
              maxLength={200}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will BTC reach $150k by end of 2026?"
            />
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-foreground-faint">Phrase as a YES/NO question.</span>
              <span className="text-foreground-faint">{question.length}/200</span>
            </div>
          </div>

          <div>
            <Label htmlFor="end-time">Resolution deadline</Label>
            <Input
              id="end-time"
              type="datetime-local"
              required
              value={endTime}
              min={new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <p className="text-xs text-foreground-faint mt-1.5">
              After this date, you (the creator) can resolve the market YES or NO.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="!mb-0">Initial AI probability</Label>
              <span className="text-sm font-mono font-semibold text-accent">{initialProb}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={initialProb}
              onChange={(e) => setInitialProb(Number(e.target.value))}
              className="w-full accent-[rgb(153_69_255)]"
            />
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted mt-2">
              <Sparkles className="size-3.5 text-accent" />
              <span>Stored on-chain as the AI&apos;s starting confidence. You can update it later as oracle.</span>
            </div>
          </div>

          <div className="pt-1">
            <Button type="submit" size="lg" disabled={!valid} loading={submitting} className="w-full sm:w-auto">
              Create market <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

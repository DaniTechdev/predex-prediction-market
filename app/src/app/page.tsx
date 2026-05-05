import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Brain } from "lucide-react";
import { MarketGrid } from "@/components/market/MarketGrid";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Hero />
      <section className="pb-20">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Live markets</h2>
            <p className="text-foreground-muted text-sm mt-1">Trade USDC against on-chain probabilities.</p>
          </div>
          <Link href="/create" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              Create market <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
        <MarketGrid />
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="py-12 sm:py-20">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent mb-6">
          <Sparkles className="size-3.5" /> Live on Solana devnet
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Bet on what&apos;s next.
          <br />
          <span className="bg-gradient-to-r from-[rgb(173_99_255)] to-[rgb(20_241_149)] bg-clip-text text-transparent">
            Settled in seconds.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-foreground-muted mt-5 max-w-xl leading-relaxed">
          {SITE.description}
        </p>
        <div className="flex items-center gap-3 mt-8 flex-col sm:flex-row w-full sm:w-auto">
          <Link href="/create" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Create a market <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="#markets" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Browse markets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 w-full text-left">
          <FeatureCard
            icon={<Zap className="size-5" />}
            title="USDC-settled"
            body="Every market is collateralized with mock USDC on devnet. No tokens to hold, no slippage games."
          />
          <FeatureCard
            icon={<Brain className="size-5" />}
            title="AI confidence"
            body="On-chain AI metadata gives you a probability signal alongside live AMM pricing."
          />
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            title="Solana-fast"
            body="Sub-second confirms. Sub-cent fees. Trade like the bookmaker, not the punter."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background-elevated/50 p-5 backdrop-blur-sm">
      <div className="size-9 rounded-md bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

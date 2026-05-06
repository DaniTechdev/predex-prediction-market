"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Zap, Brain } from "lucide-react";
import { MarketGrid } from "@/components/market/MarketGrid";
import { Button } from "@/components/ui/Button";
import { LiveStats } from "@/components/marketing/LiveStats";
import { SITE } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Hero />
      <section id="markets" className="pb-20 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Live markets</h2>
            <p className="text-foreground-muted text-sm mt-1">Trade USDC against on-chain probabilities.</p>
          </div>
          <Link href="/create" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              Create market <ArrowRight className="size-4" />
            </Button>
          </Link>
        </motion.div>
        <MarketGrid />
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="py-14 sm:py-24 relative">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent mb-7"
        >
          <span className="relative inline-flex size-2 rounded-full bg-success">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
          </span>
          Live on Solana devnet
          <Sparkles className="size-3.5" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.98]"
        >
          Bet on what&apos;s next.
          <br />
          <span className="gradient-text-animated">Settled in seconds.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-foreground-muted mt-6 max-w-xl leading-relaxed"
        >
          {SITE.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mt-9 flex-col sm:flex-row w-full sm:w-auto"
        >
          <Link href="/create" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto group">
              Create a market
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <Link href="#markets" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Browse markets
            </Button>
          </Link>
        </motion.div>

        <LiveStats />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 w-full text-left"
        >
          <FeatureCard
            icon={<Zap className="size-5" />}
            title="USDC-settled"
            body="Every market is collateralized with mock USDC on devnet. No tokens to hold, no slippage games."
            delay={0}
          />
          <FeatureCard
            icon={<Brain className="size-5" />}
            title="AI confidence"
            body="On-chain AI metadata gives you a probability signal alongside live AMM pricing."
            delay={0.08}
          />
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            title="Solana-fast"
            body="Sub-second confirms. Sub-cent fees. Trade like the bookmaker, not the punter."
            delay={0.16}
          />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-[var(--radius-card)] border border-border bg-background-elevated/50 p-5 backdrop-blur-sm transition-colors hover:border-border-strong"
    >
      <div className="size-9 rounded-md bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">{body}</p>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Plus, AlertCircle } from "lucide-react";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "./MarketCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MarketGrid() {
  const { data, isLoading, error } = useMarkets();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[220px] skeleton border-0" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 flex items-start gap-3">
        <AlertCircle className="size-5 text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Couldn&apos;t load markets</p>
          <p className="text-sm text-foreground-muted mt-1">{(error as Error).message}</p>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-10 sm:p-14 text-center flex flex-col items-center gap-4">
          <div className="size-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Plus className="size-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">No markets yet</h3>
            <p className="text-foreground-muted text-sm mt-1 max-w-sm mx-auto">
              Be the first to create a prediction market on Predex. Pose a question, set the deadline, start trading.
            </p>
          </div>
          <Link href="/create">
            <Button>Create the first market</Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.06 },
        },
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {data.map((view) => (
        <motion.div
          key={view.publicKey.toBase58()}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <MarketCard view={view} />
        </motion.div>
      ))}
    </motion.div>
  );
}

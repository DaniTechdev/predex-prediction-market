"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ConnectButton } from "./ConnectButton";

export function ConnectGate({ children }: { children: React.ReactNode }) {
  const { connected, connecting } = useWallet();

  if (connecting) {
    return <div className="h-32 skeleton rounded-[var(--radius-card)]" />;
  }

  if (!connected) {
    return (
      <Card className="p-8 sm:p-10 text-center flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
          <Wallet className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Connect your wallet</h3>
          <p className="text-sm text-foreground-muted mt-1">
            You need a Solana wallet to interact with this market.
          </p>
        </div>
        <ConnectButton />
      </Card>
    );
  }

  return <>{children}</>;
}
